import {
  definePlugin,
  runWorker,
  type Agent,
  type Goal,
  type PluginEvent,
  type ToolRunContext,
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

interface HourlyRunBudget {
  version: 1;
  windowStartedAt: string;
  count: number;
}

const STATE_KEY = "operation-state";
const HOURLY_RUN_BUDGET_KEY = "hourly-run-budget";
const PAUSED_MARKER_KEY = "paused-by-operation-control";
const GOAL_DISPATCH_ORIGIN = "plugin:local.operation-control:goal-dispatch" as const;

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

function currentHourStartedAt(): string {
  return new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
}

function isOperationState(value: unknown): value is OperationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OperationState>;
  return state.version === 1
    && ["normal", "holding", "maintenance"].includes(state.mode ?? "")
    && ["drain", "immediate"].includes(state.stopPolicy ?? "");
}

function isInvokable(agent: Agent | null): agent is Agent {
  return Boolean(agent) && !["terminated", "pending_approval", "paused"].includes(agent.status);
}

function isOpenCompanyGoal(goal: Goal): boolean {
  return goal.level === "company" && ["active", "planned"].includes(goal.status);
}

function isTerminal(status: string): boolean {
  return status === "done" || status === "cancelled";
}

function readAgentId(event: PluginEvent): string | null {
  const payload = event.payload as Record<string, unknown> | null;
  return typeof payload?.agentId === "string" ? payload.agentId : null;
}

function readGoalId(event: PluginEvent): string | null {
  const payload = event.payload as Record<string, unknown> | null;
  if (event.entityType === "goal" && event.entityId) return event.entityId;
  return typeof payload?.goalId === "string" ? payload.goalId : null;
}

function readCompanyId(params: Record<string, unknown>, fallback?: string | null): string {
  const companyId = fallback ?? params.companyId;
  if (typeof companyId !== "string" || !companyId) throw new Error("companyId is required");
  return companyId;
}

function requireAgentActor(context: { actor: { type: string; agentId: string | null } }): void {
  if (context.actor.type !== "agent" || !context.actor.agentId) {
    throw new Error("This inspection requires an Agent actor");
  }
}

function requireHumanActor(context: { actor: { type: string; userId: string | null } }): void {
  if (context.actor.type !== "user" || !context.actor.userId) {
    throw new Error("This operation requires a human actor");
  }
}

function dispatchDescription(goal: Goal): string {
  return `Start autonomous delivery for Company Goal ${goal.id}.

Use Paperclip native Issues, child relations, blockers and executionPolicy. Do not create a separate Milestone state machine.

1. Read the Goal and relevant Project state.
2. Record a concise autonomy envelope: allowed scope, forbidden actions, budget/time bound, verification and risk level.
3. Create the smallest useful implementation Task tree and assign capable Agents.
4. Put an independent Agent review stage on code or deliverable Tasks with native executionPolicy.
5. Add a human approval stage only for destructive, production, external-communication, permission, secret, legal, financial or materially irreversible actions.
6. Continue automatically through review feedback. Escalate only when the work must leave the approved scope, needs a human-only permission, exceeds its bound or fails the same acceptance criterion twice.
7. Finish with one concise Goal-level report. Do not require a separate Git Milestone report or Board confirmation for ordinary reversible work.`;
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

      const saveState = async (companyId: string, state: OperationState): Promise<void> => {
        await ctx.state.set(companyStateKey(companyId, STATE_KEY), state);
      };

      const getConfig = async () => {
        const config = await ctx.config.get();
        const orchestratorRole = typeof config.orchestratorRole === "string"
          ? config.orchestratorRole.trim()
          : "";
        if (!orchestratorRole) throw new Error("operation-control requires config.orchestratorRole");
        return {
          orchestratorRole,
          autoDispatchGoals: config.autoDispatchGoals !== false,
          maxRunsPerHour: typeof config.maxRunsPerHour === "number"
            && Number.isInteger(config.maxRunsPerHour)
            && config.maxRunsPerHour > 0
            ? config.maxRunsPerHour
            : 0,
        };
      };

      const getHourlyRunBudget = async (companyId: string) => {
        const { maxRunsPerHour: limit } = await getConfig();
        const windowStartedAt = currentHourStartedAt();
        const value = await ctx.state.get(companyStateKey(companyId, HOURLY_RUN_BUDGET_KEY));
        const saved = value as Partial<HourlyRunBudget> | null;
        const count = saved?.version === 1
          && saved.windowStartedAt === windowStartedAt
          && typeof saved.count === "number"
          && Number.isInteger(saved.count)
          && saved.count >= 0
          ? saved.count
          : 0;
        return { version: 1 as const, windowStartedAt, count, limit };
      };

      const recordRunStart = async (companyId: string) => {
        const budget = await getHourlyRunBudget(companyId);
        const next: HourlyRunBudget = {
          version: 1,
          windowStartedAt: budget.windowStartedAt,
          count: budget.count + 1,
        };
        await ctx.state.set(companyStateKey(companyId, HOURLY_RUN_BUDGET_KEY), next);
        return { ...next, limit: budget.limit };
      };

      const resolveOrchestrator = async (companyId: string): Promise<Agent> => {
        const { orchestratorRole } = await getConfig();
        const matches = (await ctx.agents.list({ companyId }))
          .filter((agent) => isInvokable(agent) && agent.role === orchestratorRole);
        if (matches.length !== 1) {
          throw new Error("Autonomous Goal dispatch requires exactly one active orchestrator");
        }
        return matches[0];
      };

      const dispatchGoal = async (companyId: string, goalId: string) => {
        const operation = await getState(companyId);
        if (operation.mode !== "normal") return { status: "deferred", goalId };
        const { autoDispatchGoals } = await getConfig();
        if (!autoDispatchGoals) return { status: "disabled", goalId };

        const goal = await ctx.goals.get(goalId, companyId);
        if (!goal || !isOpenCompanyGoal(goal)) return { status: "ignored", goalId };

        const existing = await ctx.issues.list({
          companyId,
          originKind: GOAL_DISPATCH_ORIGIN,
          originId: goal.id,
          includePluginOperations: true,
          limit: 1,
        });
        if (existing[0]) {
          if (isTerminal(existing[0].status)) {
            return { status: "completed", goalId, issueId: existing[0].id };
          }
          await ctx.issues.requestWakeup(existing[0].id, companyId, {
            reason: "Company Goal dispatch is ready for autonomous decomposition and delivery.",
            contextSource: "operation-control:goal-dispatch",
            idempotencyKey: `${goal.id}:autonomous-goal-dispatch`,
          });
          return { status: "existing", goalId, issueId: existing[0].id };
        }

        const orchestrator = await resolveOrchestrator(companyId);
        const issue = await ctx.issues.create({
          companyId,
          goalId: goal.id,
          title: `Deliver Goal autonomously: ${goal.title}`,
          description: dispatchDescription(goal),
          status: "todo",
          priority: "high",
          assigneeAgentId: orchestrator.id,
          originKind: GOAL_DISPATCH_ORIGIN,
          originId: goal.id,
        });
        await ctx.issues.requestWakeup(issue.id, companyId, {
          reason: "New Company Goal is ready for autonomous decomposition and delivery.",
          contextSource: "operation-control:goal-dispatch",
          idempotencyKey: `${goal.id}:autonomous-goal-dispatch`,
        });
        return { status: "created", goalId, issueId: issue.id, orchestratorAgentId: orchestrator.id };
      };

      const dispatchOpenGoals = async (companyId: string) => {
        const goals = await ctx.goals.list({ companyId, level: "company", limit: 100 });
        const results = [];
        for (const goal of goals.filter(isOpenCompanyGoal)) {
          results.push(await dispatchGoal(companyId, goal.id));
        }
        return results;
      };

      const pauseAgent = async (companyId: string, agentId: string, cancelRunning: boolean): Promise<boolean> => {
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

      const reconcile = async (companyId: string, state: OperationState, cancelExistingRuns: boolean) => {
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
          const maintenance: OperationState = {
            ...state,
            mode: "maintenance",
            changedAt: new Date().toISOString(),
          };
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

        const budget = await getHourlyRunBudget(companyId);
        await ctx.state.set(companyStateKey(companyId, HOURLY_RUN_BUDGET_KEY), {
          version: 1,
          windowStartedAt: budget.windowStartedAt,
          count: 0,
        } satisfies HourlyRunBudget);

        const agents = await ctx.agents.list({ companyId });
        for (const agent of agents) {
          const marker = agentMarkerKey(agent.id);
          if (await ctx.state.get(marker) !== true) continue;
          if (agent.status === "paused") await ctx.agents.resume(agent.id, companyId);
          await ctx.state.delete(marker);
        }
        await dispatchOpenGoals(companyId);
        return state;
      };

      const operationData = async (companyId: string) => {
        const [state, runBudget, agents, config] = await Promise.all([
          getState(companyId),
          getHourlyRunBudget(companyId),
          ctx.agents.list({ companyId }),
          getConfig(),
        ]);
        return {
          state,
          runBudget,
          agents: agents.map(({ id, name, title, role, status }: Agent) => ({ id, name, title, role, status })),
          autonomy: {
            autoDispatchGoals: config.autoDispatchGoals,
            orchestratorRole: config.orchestratorRole,
            deliveryControl: "paperclip-native",
          },
        };
      };

      const handleGoal = async (event: PluginEvent) => {
        const goalId = readGoalId(event);
        if (!goalId) return;
        await dispatchGoal(event.companyId, goalId);
      };

      const handleStarted = async (event: PluginEvent) => {
        const agentId = readAgentId(event);
        if (!agentId) return;
        const budget = await recordRunStart(event.companyId);
        if (budget.limit > 0 && budget.count > budget.limit) {
          const existing = await getState(event.companyId);
          if (existing.mode === "normal") {
            const requestedAt = new Date().toISOString();
            const stopped: OperationState = {
              version: 1,
              mode: "maintenance",
              stopPolicy: "immediate",
              ownerAgentId: null,
              reason: `Hourly run limit exceeded (${budget.count}/${budget.limit})`,
              requestedAt,
              changedAt: requestedAt,
            };
            await saveState(event.companyId, stopped);
            await reconcile(event.companyId, stopped, true);
          }
          return;
        }

        const state = await getState(event.companyId);
        if (state.mode === "normal" || agentId === state.ownerAgentId) return;
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

      ctx.tools.register(
        "inspect-operation-state",
        {
          displayName: "Inspect Operation State",
          description: "Read Company maintenance mode, run budget and autonomous Goal dispatch configuration.",
          parametersSchema: { type: "object", properties: {}, additionalProperties: false },
        },
        async (_params, runContext: ToolRunContext) => {
          const result = await operationData(runContext.companyId);
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.data.register("operation-control", async (params) => operationData(readCompanyId(params)));

      ctx.actions.register("inspect-operation-state", async (params, context) => {
        requireAgentActor(context);
        return operationData(readCompanyId(params, context.companyId));
      });

      ctx.actions.register("dispatch-goal", async (params, context) => {
        requireHumanActor(context);
        const companyId = readCompanyId(params, context.companyId);
        const goalId = params.goalId;
        if (typeof goalId !== "string" || !goalId) throw new Error("goalId is required");
        return serialized(companyId, () => dispatchGoal(companyId, goalId));
      });

      ctx.actions.register("start-maintenance", async (params, context) => {
        requireHumanActor(context);
        const companyId = readCompanyId(params, context.companyId);
        const ownerAgentId = params.ownerAgentId;
        const stopPolicy = params.stopPolicy;
        const reason = typeof params.reason === "string" && params.reason.trim() ? params.reason.trim() : null;
        if (typeof ownerAgentId !== "string") throw new Error("ownerAgentId is required");
        if (stopPolicy !== "drain" && stopPolicy !== "immediate") {
          throw new Error("stopPolicy must be drain or immediate");
        }
        return serialized(companyId, () => startMaintenance(companyId, ownerAgentId, stopPolicy, reason));
      });

      ctx.actions.register("resume-normal", async (params, context) => {
        requireHumanActor(context);
        const companyId = readCompanyId(params, context.companyId);
        return serialized(companyId, () => resumeNormal(companyId));
      });

      ctx.events.on("goal.created", (event) => serialized(event.companyId, () => handleGoal(event)));
      ctx.events.on("goal.updated", (event) => serialized(event.companyId, () => handleGoal(event)));
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
