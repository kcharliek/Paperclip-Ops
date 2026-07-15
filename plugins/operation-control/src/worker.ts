import {
  definePlugin,
  runWorker,
  type Agent,
  type PluginContext,
  type PluginEvent,
} from "@paperclipai/plugin-sdk";

type Mode = "normal" | "holding" | "maintenance";
type StopPolicy = "drain" | "immediate";

export interface OperationState {
  version: 1;
  mode: Mode;
  stopPolicy: StopPolicy;
  ownerAgentId: string | null;
  reason: string | null;
  requestedAt: string | null;
  changedAt: string;
}

const STATE_KEY = "operation-state";
const ARTIFACT_ISSUE_KEY = "operation-state-issue-id";
const PAUSED_MARKER_KEY = "paused-by-operation-control";
const ARTIFACT_ORIGIN = "plugin:operation-control" as const;

const normalState = (): OperationState => ({
  version: 1,
  mode: "normal",
  stopPolicy: "drain",
  ownerAgentId: null,
  reason: null,
  requestedAt: null,
  changedAt: new Date().toISOString(),
});

function companyStateKey(companyId: string, stateKey: string) {
  return { scopeKind: "company" as const, scopeId: companyId, stateKey };
}

function agentMarkerKey(agentId: string) {
  return { scopeKind: "agent" as const, scopeId: agentId, stateKey: PAUSED_MARKER_KEY };
}

function readAgentId(event: PluginEvent): string | null {
  const payload = event.payload as Record<string, unknown> | null;
  return typeof payload?.agentId === "string" ? payload.agentId : null;
}

function readCompanyId(params: Record<string, unknown>, fallback?: string | null): string {
  const companyId = fallback ?? params.companyId;
  if (typeof companyId !== "string" || !companyId) throw new Error("companyId is required");
  return companyId;
}

function isOperationState(value: unknown): value is OperationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OperationState>;
  return state.version === 1
    && ["normal", "holding", "maintenance"].includes(state.mode ?? "")
    && ["drain", "immediate"].includes(state.stopPolicy ?? "");
}

function artifactBody(state: OperationState): string {
  return `# Company Operation State

Agents must read this state before starting new work. Only \`ownerAgentId\` may work while the mode is \`holding\` or \`maintenance\`.

\`\`\`json
${JSON.stringify(state, null, 2)}
\`\`\`
`;
}

export function createOperationPlugin() {
  return definePlugin({
    async setup(ctx) {
      const queues = new Map<string, Promise<unknown>>();

      const serialized = <T>(companyId: string, task: () => Promise<T>): Promise<T> => {
        const next = (queues.get(companyId) ?? Promise.resolve()).then(task, task);
        const queued = next.catch(() => undefined);
        queues.set(companyId, queued);
        return next.finally(() => {
          if (queues.get(companyId) === queued) queues.delete(companyId);
        });
      };

      const getState = async (companyId: string): Promise<OperationState> => {
        const value = await ctx.state.get(companyStateKey(companyId, STATE_KEY));
        return isOperationState(value) ? value : normalState();
      };

      const ensureArtifactIssue = async (companyId: string): Promise<string> => {
        const saved = await ctx.state.get(companyStateKey(companyId, ARTIFACT_ISSUE_KEY));
        if (typeof saved === "string" && await ctx.issues.get(saved, companyId)) return saved;

        const existing = await ctx.issues.list({
          companyId,
          originKind: ARTIFACT_ORIGIN,
          originId: STATE_KEY,
          includePluginOperations: true,
          limit: 1,
        });
        const issue = existing[0] ?? await ctx.issues.create({
          companyId,
          title: "Company Operation State",
          description: "Canonical operational state used to coordinate maintenance windows.",
          status: "backlog",
          priority: "high",
          surfaceVisibility: "default",
          originKind: ARTIFACT_ORIGIN,
          originId: STATE_KEY,
        });
        await ctx.state.set(companyStateKey(companyId, ARTIFACT_ISSUE_KEY), issue.id);
        return issue.id;
      };

      const saveState = async (companyId: string, state: OperationState): Promise<void> => {
        await ctx.state.set(companyStateKey(companyId, STATE_KEY), state);
        try {
          const issueId = await ensureArtifactIssue(companyId);
          await ctx.issues.documents.upsert({
            companyId,
            issueId,
            key: STATE_KEY,
            title: "Company Operation State",
            format: "markdown",
            body: artifactBody(state),
            changeSummary: `Operation mode changed to ${state.mode}`,
          });
        } catch (error) {
          ctx.logger.warn("Operation state saved, but Artifact synchronization failed", {
            companyId,
            error: String(error),
          });
        }
      };

      const pauseAgent = async (
        companyId: string,
        agentId: string,
        cancelRunning: boolean,
      ): Promise<boolean> => {
        const agent = await ctx.agents.get(agentId, companyId);
        if (!agent || agent.status === "paused" || agent.status === "terminated") return false;
        if (agent.status === "running" && !cancelRunning) return false;

        const marker = agentMarkerKey(agentId);
        await ctx.state.set(marker, true);
        try {
          await ctx.agents.pause(agentId, companyId);
          return true;
        } catch (error) {
          await ctx.state.delete(marker);
          ctx.logger.error("Failed to pause agent", { companyId, agentId, error: String(error) });
          return false;
        }
      };

      const reconcile = async (
        companyId: string,
        state: OperationState,
        cancelExistingRuns: boolean,
      ): Promise<OperationState> => {
        if (state.mode === "normal") return state;

        const agents = await ctx.agents.list({ companyId });
        for (const agent of agents) {
          if (agent.id === state.ownerAgentId) continue;
          await pauseAgent(companyId, agent.id, cancelExistingRuns);
        }

        const remaining = await ctx.agents.list({ companyId });
        const stillRunning = remaining.some(
          (agent) => agent.id !== state.ownerAgentId && agent.status === "running",
        );
        if (state.mode === "holding" && !stillRunning) {
          const maintenance = { ...state, mode: "maintenance" as const, changedAt: new Date().toISOString() };
          await saveState(companyId, maintenance);
          return maintenance;
        }
        return state;
      };

      const startMaintenance = async (
        companyId: string,
        ownerAgentId: string,
        stopPolicy: StopPolicy,
        reason: string | null,
      ) => {
        const owner = await ctx.agents.get(ownerAgentId, companyId);
        if (!owner || owner.status === "terminated") throw new Error("Select an active maintenance owner");

        const requestedAt = new Date().toISOString();
        const state: OperationState = {
          version: 1,
          mode: "holding",
          stopPolicy,
          ownerAgentId,
          reason,
          requestedAt,
          changedAt: requestedAt,
        };
        await saveState(companyId, state);
        return reconcile(companyId, state, stopPolicy === "immediate");
      };

      const resumeNormal = async (companyId: string) => {
        const previous = await getState(companyId);
        const state: OperationState = {
          ...previous,
          mode: "normal",
          requestedAt: null,
          changedAt: new Date().toISOString(),
        };
        await saveState(companyId, state);

        const agents = await ctx.agents.list({ companyId });
        for (const agent of agents) {
          const marker = agentMarkerKey(agent.id);
          if (await ctx.state.get(marker) !== true) continue;
          if (agent.status === "paused") await ctx.agents.resume(agent.id, companyId);
          await ctx.state.delete(marker);
        }
        return state;
      };

      const handleStarted = async (event: PluginEvent) => {
        const agentId = readAgentId(event);
        if (!agentId) return;
        const state = await getState(event.companyId);
        if (state.mode === "normal" || agentId === state.ownerAgentId) return;

        // This run started after the hold flag, so it is not part of the drain set.
        await pauseAgent(event.companyId, agentId, true);
        await reconcile(event.companyId, state, false);
      };

      const handleTerminal = async (event: PluginEvent) => {
        const agentId = readAgentId(event);
        if (!agentId) return;
        const state = await getState(event.companyId);
        if (state.mode === "normal" || agentId === state.ownerAgentId) return;

        await pauseAgent(event.companyId, agentId, false);
        await reconcile(event.companyId, state, false);
      };

      ctx.data.register("operation-control", async (params) => {
        const companyId = readCompanyId(params);
        const [state, agents, artifactIssueId] = await Promise.all([
          getState(companyId),
          ctx.agents.list({ companyId }),
          ctx.state.get(companyStateKey(companyId, ARTIFACT_ISSUE_KEY)),
        ]);
        return {
          state,
          agents: agents.map(({ id, name, title, status }: Agent) => ({ id, name, title, status })),
          artifactIssueId: typeof artifactIssueId === "string" ? artifactIssueId : null,
        };
      });

      ctx.actions.register("start-maintenance", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        const ownerAgentId = params.ownerAgentId;
        const stopPolicy = params.stopPolicy;
        const reason = typeof params.reason === "string" && params.reason.trim()
          ? params.reason.trim()
          : null;
        if (typeof ownerAgentId !== "string") throw new Error("ownerAgentId is required");
        if (stopPolicy !== "drain" && stopPolicy !== "immediate") {
          throw new Error("stopPolicy must be drain or immediate");
        }
        return serialized(companyId, () => startMaintenance(companyId, ownerAgentId, stopPolicy, reason));
      });

      ctx.actions.register("resume-normal", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        return serialized(companyId, () => resumeNormal(companyId));
      });

      ctx.events.on("agent.run.started", (event) => serialized(event.companyId, () => handleStarted(event)));
      for (const eventType of ["agent.run.finished", "agent.run.failed", "agent.run.cancelled"] as const) {
        ctx.events.on(eventType, (event) => serialized(event.companyId, () => handleTerminal(event)));
      }
    },
  });
}

const plugin = createOperationPlugin();
export default plugin;
runWorker(plugin, import.meta.url);
