import {
  definePlugin,
  runWorker,
  type Agent,
  type Goal,
  type Issue,
  type PluginContext,
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

const STATE_KEY = "operation-state";
const ARTIFACT_ISSUE_KEY = "operation-state-issue-id";
const PAUSED_MARKER_KEY = "paused-by-operation-control";
const ARTIFACT_ORIGIN = "plugin:operation-control" as const;
const DELIVERY_STATE_KEY_PREFIX = "delivery-control:";
const DELIVERY_NODE_KEY = "delivery-node";
const DELIVERY_MILESTONE_KEY = "delivery-milestone";

type DeliveryPhase =
  | "goal_registered"
  | "milestone_pending"
  | "milestone_confirmed"
  | "executing"
  | "awaiting_human_confirmation"
  | "completed";

interface DeliveryState {
  version: 1;
  goalId: string;
  milestoneId: string | null;
  rootTaskId: string | null;
  orchestratorAgentId?: string | null;
  rootOwnerAgentId?: string | null;
  report?: MilestoneReport | null;
  phase: DeliveryPhase;
  rejectionCount: number;
  changedAt: string;
}

interface MilestoneReport {
  path: string;
  commitSha: string;
  summary: string;
  interactionId: string;
}

interface DeliveryNode {
  rootTaskId: string;
  goalId: string;
  milestoneId: string;
  parentId: string | null;
}

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

function deliveryStateKey(companyId: string, goalId: string) {
  return {
    scopeKind: "company" as const,
    scopeId: companyId,
    stateKey: `${DELIVERY_STATE_KEY_PREFIX}${goalId}`,
  };
}

function deliveryNodeKey(issueId: string) {
  return { scopeKind: "issue" as const, scopeId: issueId, stateKey: DELIVERY_NODE_KEY };
}

function deliveryMilestoneKey(goalId: string) {
  return { scopeKind: "goal" as const, scopeId: goalId, stateKey: DELIVERY_MILESTONE_KEY };
}

function actorAgentId(context: { actor: { type: string; agentId: string | null } }): string {
  if (context.actor.type !== "agent" || !context.actor.agentId) {
    throw new Error("This workflow step requires an Agent actor");
  }
  return context.actor.agentId;
}

function actorUser(context: { actor: { type: string; userId: string | null } }): string {
  if (context.actor.type !== "user" || !context.actor.userId) {
    throw new Error("This workflow step requires a human actor");
  }
  return context.actor.userId;
}

function stringParam(params: Record<string, unknown>, name: string): string {
  const value = params[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function reportCommitParam(params: Record<string, unknown>): string {
  const value = stringParam(params, "commitSha").toLowerCase();
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value)) {
    throw new Error("commitSha must be a full Git commit SHA");
  }
  return value;
}

function isTerminal(issue: Issue): boolean {
  return issue.status === "done" || issue.status === "cancelled";
}

function freshDeliveryState(goalId: string): DeliveryState {
  return {
    version: 1,
    goalId,
    milestoneId: null,
    rootTaskId: null,
    orchestratorAgentId: null,
    rootOwnerAgentId: null,
    report: null,
    phase: "goal_registered",
    rejectionCount: 0,
    changedAt: new Date().toISOString(),
  };
}

function isDeliveryState(value: unknown): value is DeliveryState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DeliveryState>;
  return state.version === 1
    && typeof state.goalId === "string"
    && (state.milestoneId === null || typeof state.milestoneId === "string")
    && (state.rootTaskId === null || typeof state.rootTaskId === "string")
    && (state.orchestratorAgentId == null || typeof state.orchestratorAgentId === "string")
    && (state.rootOwnerAgentId == null || typeof state.rootOwnerAgentId === "string")
    && (state.report == null || (
      typeof state.report.path === "string"
      && typeof state.report.commitSha === "string"
      && typeof state.report.summary === "string"
      && typeof state.report.interactionId === "string"
    ))
    && [
      "goal_registered",
      "milestone_pending",
      "milestone_confirmed",
      "executing",
      "awaiting_human_confirmation",
      "completed",
    ].includes(state.phase ?? "")
    && typeof state.rejectionCount === "number";
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

      const getDeliveryState = async (companyId: string, goalId: string): Promise<DeliveryState | null> => {
        const value = await ctx.state.get(deliveryStateKey(companyId, goalId));
        return isDeliveryState(value) ? value : null;
      };

      const saveDeliveryState = async (
        companyId: string,
        state: DeliveryState,
      ): Promise<DeliveryState> => {
        const next = { ...state, changedAt: new Date().toISOString() };
        await ctx.state.set(deliveryStateKey(companyId, state.goalId), next);
        if (next.milestoneId) await ctx.state.set(deliveryMilestoneKey(next.milestoneId), next);
        if (next.rootTaskId) {
          await ctx.state.set(deliveryNodeKey(next.rootTaskId), {
            rootTaskId: next.rootTaskId,
            goalId: next.goalId,
            milestoneId: next.milestoneId,
            parentId: null,
          } satisfies DeliveryNode);
        }
        return next;
      };

      const getIssueNode = async (issueId: string): Promise<DeliveryNode | null> => {
        const value = await ctx.state.get(deliveryNodeKey(issueId));
        if (!value || typeof value !== "object") return null;
        const node = value as Partial<DeliveryNode>;
        return typeof node.rootTaskId === "string" && typeof node.goalId === "string" && typeof node.milestoneId === "string"
          ? { rootTaskId: node.rootTaskId, goalId: node.goalId, milestoneId: node.milestoneId, parentId: node.parentId ?? null }
          : null;
      };

      const getIssueDelivery = async (
        companyId: string,
        issue: Issue,
      ): Promise<{ state: DeliveryState; node: DeliveryNode } | null> => {
        let current: Issue | null = issue;
        while (current) {
          const node = await getIssueNode(current.id);
          if (node) {
            const state = await getDeliveryState(companyId, node.goalId);
            return state ? { state, node } : null;
          }
          current = current.parentId ? await ctx.issues.get(current.parentId, companyId) : null;
        }
        return null;
      };

      const directChildren = async (issueId: string, companyId: string): Promise<Issue[]> => {
        const subtree = await ctx.issues.getSubtree(issueId, companyId, { includeRoot: false });
        return subtree.issues.filter((item) => item.parentId === issueId);
      };

      const requireGoal = async (goalId: string, companyId: string): Promise<Goal> => {
        const goal = await ctx.goals.get(goalId, companyId);
        if (!goal) throw new Error("Goal not found");
        return goal;
      };

      const getOrchestratorRole = async (): Promise<string> => {
        const config = await ctx.config.get();
        const role = config.orchestratorRole;
        if (typeof role !== "string" || !role.trim()) {
          throw new Error("operation-control requires config.orchestratorRole");
        }
        return role.trim();
      };

      const requireOrchestrator = async (agentId: string, companyId: string): Promise<Agent> => {
        const orchestratorRole = await getOrchestratorRole();
        const agent = await ctx.agents.get(agentId, companyId);
        if (!agent || agent.status === "terminated" || agent.role !== orchestratorRole) {
          throw new Error("Only the configured workflow orchestrator may perform this workflow step");
        }
        return agent;
      };

      const resolveOrchestrator = async (companyId: string, preferredAgentId?: string | null): Promise<Agent> => {
        if (preferredAgentId) return requireOrchestrator(preferredAgentId, companyId);
        const role = await getOrchestratorRole();
        const matches = (await ctx.agents.list({ companyId }))
          .filter((agent) => agent.status !== "terminated" && agent.role === role);
        if (matches.length !== 1) throw new Error("Delivery workflow requires exactly one active orchestrator");
        return matches[0];
      };

      const createChildTask = async (
        companyId: string,
        actorId: string,
        actorRunId: string | null,
        params: Record<string, unknown>,
      ) => {
        const parent = await ctx.issues.get(stringParam(params, "parentIssueId"), companyId);
        if (!parent) throw new Error("Parent Task not found");
        const tracked = await getIssueDelivery(companyId, parent);
        if (!tracked || tracked.state.phase === "completed") throw new Error("Parent is not in an active delivery workflow");
        if (parent.assigneeAgentId !== actorId) throw new Error("Only the parent Task owner may decompose it");
        if (parent.status === "done" || parent.status === "cancelled") throw new Error("A terminal parent cannot receive child Tasks");

        const assigneeAgentId = stringParam(params, "assigneeAgentId");
        if (assigneeAgentId === actorId) throw new Error("A parent owner cannot review its own child Task");
        const assignee = await ctx.agents.get(assigneeAgentId, companyId);
        if (!assignee || assignee.status === "terminated") throw new Error("Child assignee must be active");

        const blockedByIssueIds = Array.isArray(params.blockedByIssueIds)
          ? params.blockedByIssueIds.filter((value): value is string => typeof value === "string")
          : [];
        for (const blockerId of blockedByIssueIds) {
          const blocker = await ctx.issues.get(blockerId, companyId);
          if (!blocker || blocker.parentId !== parent.id) throw new Error("Sibling blockers must share the same parent");
        }

        const child = await ctx.issues.create({
          companyId,
          parentId: parent.id,
          goalId: parent.goalId ?? undefined,
          inheritExecutionWorkspaceFromIssueId: parent.id,
          title: stringParam(params, "title"),
          description: typeof params.description === "string" ? params.description : undefined,
          status: "todo",
          priority: parent.priority,
          assigneeAgentId,
          blockedByIssueIds,
          originKind: "plugin:local.operation-control:delivery-child",
          originId: `${parent.id}:${Date.now()}`,
          actor: { actorAgentId: actorId, actorRunId },
        });
        await ctx.state.set(deliveryNodeKey(child.id), {
          rootTaskId: tracked.node.rootTaskId,
          goalId: tracked.state.goalId,
          milestoneId: tracked.node.milestoneId,
          parentId: parent.id,
        } satisfies DeliveryNode);
        if (parent.status === "todo" || parent.status === "backlog") {
          await ctx.issues.update(parent.id, { status: "in_progress" }, companyId, { actorAgentId: actorId, actorRunId });
        }
        return child;
      };

      const reviewNode = async (
        companyId: string,
        actorId: string,
        actorRunId: string | null,
        params: Record<string, unknown>,
      ) => {
        const issue = await ctx.issues.get(stringParam(params, "issueId"), companyId);
        if (!issue) throw new Error("Node Task not found");
        const tracked = await getIssueDelivery(companyId, issue);
        if (!tracked || tracked.state.phase === "completed") throw new Error("Task is not in an active delivery workflow");
        if (issue.assigneeAgentId !== actorId) throw new Error("Only the Node owner may review its children");

        const children = await directChildren(issue.id, companyId);
        if (!children.length) throw new Error("A Node Task must have at least one child");
        if (children.some((child) => !isTerminal(child))) throw new Error("All child Tasks must be terminal before review");
        if (children.some((child) => child.assigneeAgentId === actorId)) {
          throw new Error("The Node owner cannot review a child it executed");
        }

        const decision = params.decision;
        if (decision !== "approved" && decision !== "rejected") throw new Error("decision must be approved or rejected");
        if (decision === "rejected") {
          const reason = stringParam(params, "reason");
          const remediation = await ctx.issues.create({
            companyId,
            parentId: issue.id,
            goalId: issue.goalId ?? undefined,
            inheritExecutionWorkspaceFromIssueId: issue.id,
            title: `Remediation: ${reason.slice(0, 80)}`,
            description: `## Rejection reason\n\n${reason}`,
            status: "todo",
            priority: issue.priority,
            assigneeAgentId: stringParam(params, "assigneeAgentId"),
            originKind: "plugin:local.operation-control:delivery-remediation",
            originId: `${issue.id}:rejection:${tracked.state.rejectionCount + 1}`,
            actor: { actorAgentId: actorId, actorRunId },
          });
          await ctx.state.set(deliveryNodeKey(remediation.id), {
            rootTaskId: tracked.node.rootTaskId,
            goalId: tracked.state.goalId,
            milestoneId: tracked.node.milestoneId,
            parentId: issue.id,
          } satisfies DeliveryNode);
          await ctx.issues.update(issue.id, { status: "in_progress" }, companyId, { actorAgentId: actorId, actorRunId });
          await saveDeliveryState(companyId, {
            ...tracked.state,
            phase: "executing",
            rejectionCount: tracked.state.rejectionCount + 1,
          });
          return { decision, remediationIssueId: remediation.id };
        }

        if (issue.id === tracked.state.rootTaskId) {
          const orchestrator = await resolveOrchestrator(companyId, tracked.state.orchestratorAgentId);
          await ctx.issues.update(
            issue.id,
            { status: "in_review", assigneeAgentId: orchestrator.id },
            companyId,
            { actorAgentId: actorId, actorRunId },
          );
          await saveDeliveryState(companyId, {
            ...tracked.state,
            orchestratorAgentId: orchestrator.id,
            phase: "executing",
          });
          await ctx.issues.requestWakeup(issue.id, companyId, {
            reason: "Root review completed; verify the Git milestone report and request Board confirmation.",
            contextSource: "operation-control:milestone-report",
            idempotencyKey: `${issue.id}:milestone-report:${tracked.state.rejectionCount}`,
            actorAgentId: actorId,
            actorRunId,
          });
          return { decision, issueId: issue.id, phase: "executing", next: "milestone_report" };
        }
        await ctx.issues.update(issue.id, { status: "done" }, companyId, { actorAgentId: actorId, actorRunId });
        return { decision, issueId: issue.id, phase: "executing" };
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

      const registerGoal = async (companyId: string, userId: string, params: Record<string, unknown>) => {
        const goal = await ctx.goals.create({
          companyId,
          title: stringParam(params, "title"),
          description: typeof params.description === "string" ? params.description : undefined,
          level: "company",
          status: "active",
        });
        await saveDeliveryState(companyId, freshDeliveryState(goal.id));
        ctx.logger.info("Delivery Goal registered", { companyId, goalId: goal.id, userId });
        return goal;
      };

      const proposeMilestone = async (companyId: string, agentId: string, params: Record<string, unknown>) => {
        const goal = await requireGoal(stringParam(params, "goalId"), companyId);
        if (goal.level !== "company") throw new Error("Milestones must be based on a company Goal");
        await requireOrchestrator(agentId, companyId);
        const current = await getDeliveryState(companyId, goal.id);
        if (!current) throw new Error("Register the Goal through delivery-control first");
        if (current.milestoneId) throw new Error("This Goal already has a Milestone in progress");

        const milestone = await ctx.goals.create({
          companyId,
          title: stringParam(params, "title"),
          description: typeof params.description === "string" ? params.description : undefined,
          level: "team",
          status: "planned",
          parentId: goal.id,
          ownerAgentId: agentId,
        });
        await saveDeliveryState(companyId, { ...current, milestoneId: milestone.id, phase: "milestone_pending" });
        return milestone;
      };

      const confirmMilestone = async (companyId: string, userId: string, params: Record<string, unknown>) => {
        const goal = await requireGoal(stringParam(params, "goalId"), companyId);
        const state = await getDeliveryState(companyId, goal.id);
        if (!state?.milestoneId || state.phase !== "milestone_pending") throw new Error("No Milestone is awaiting human confirmation");
        const milestone = await requireGoal(state.milestoneId, companyId);
        const confirmed = await ctx.goals.update(milestone.id, { status: "active" }, companyId);
        await saveDeliveryState(companyId, { ...state, phase: "milestone_confirmed" });
        ctx.logger.info("Milestone confirmed by human", { companyId, goalId: goal.id, milestoneId: milestone.id, userId });
        return confirmed;
      };

      const createRootTask = async (companyId: string, agentId: string, runId: string | null, params: Record<string, unknown>) => {
        const goal = await requireGoal(stringParam(params, "goalId"), companyId);
        const orchestrator = await requireOrchestrator(agentId, companyId);
        const state = await getDeliveryState(companyId, goal.id);
        if (!state?.milestoneId || state.phase !== "milestone_confirmed") throw new Error("Milestone must be human-confirmed before Root Task creation");
        const assigneeAgentId = stringParam(params, "assigneeAgentId");
        const assignee = await ctx.agents.get(assigneeAgentId, companyId);
        if (!assignee || assignee.status === "terminated" || assignee.role === orchestrator.role) throw new Error("Root Task must be assigned to an active execution Agent");
        const root = await ctx.issues.create({
          companyId,
          projectId: typeof params.projectId === "string" ? params.projectId : undefined,
          goalId: state.milestoneId,
          title: stringParam(params, "title"),
          description: typeof params.description === "string" ? params.description : undefined,
          status: "todo",
          priority: "high",
          assigneeAgentId,
          originKind: "plugin:local.operation-control:delivery-root",
          originId: `${state.milestoneId}:root`,
          actor: { actorAgentId: agentId, actorRunId: runId },
        });
        await ctx.state.set(deliveryNodeKey(root.id), {
          rootTaskId: root.id,
          goalId: goal.id,
          milestoneId: state.milestoneId,
          parentId: null,
        } satisfies DeliveryNode);
        await saveDeliveryState(companyId, {
          ...state,
          rootTaskId: root.id,
          orchestratorAgentId: agentId,
          rootOwnerAgentId: assigneeAgentId,
          report: null,
          phase: "executing",
        });
        return root;
      };

      const requestMilestoneReview = async (
        companyId: string,
        agentId: string,
        runId: string | null,
        params: Record<string, unknown>,
      ) => {
        const goal = await requireGoal(stringParam(params, "goalId"), companyId);
        await requireOrchestrator(agentId, companyId);
        const state = await getDeliveryState(companyId, goal.id);
        if (!state?.milestoneId || !state.rootTaskId) throw new Error("Milestone delivery is not ready for reporting");
        const reportPath = stringParam(params, "reportPath");
        const expectedPath = `docs/milestones/${state.milestoneId}.md`;
        if (reportPath !== expectedPath) throw new Error(`reportPath must be ${expectedPath}`);
        const commitSha = reportCommitParam(params);
        const summary = stringParam(params, "summary");
        if (summary.length > 1000) throw new Error("summary must be 1000 characters or fewer");
        const evidence = typeof params.evidence === "string" ? params.evidence.trim() : "";
        if (evidence.length > 18000) throw new Error("evidence must be 18000 characters or fewer");

        if (state.phase === "awaiting_human_confirmation" && state.report) {
          if (state.report.path !== reportPath || state.report.commitSha !== commitSha || state.report.summary !== summary) {
            throw new Error("A different Milestone report is already awaiting confirmation");
          }
          return { interactionId: state.report.interactionId, report: state.report, phase: state.phase };
        }
        if (state.phase !== "executing") throw new Error("Milestone is not ready for a completion report");
        const root = await ctx.issues.get(state.rootTaskId, companyId);
        if (!root || root.status !== "in_review" || root.assigneeAgentId !== agentId) {
          throw new Error("Root Task must be in review with the workflow orchestrator");
        }
        const milestone = await requireGoal(state.milestoneId, companyId);
        const detailsMarkdown = [
          `- Report: \`${reportPath}\``,
          `- Git commit: \`${commitSha}\``,
          `- Summary: ${summary}`,
          evidence ? `\n## Evidence\n\n${evidence}` : "",
        ].filter(Boolean).join("\n");
        const interaction = await ctx.issues.requestConfirmation(root.id, {
          idempotencyKey: `milestone-report:${state.milestoneId}:${commitSha}`,
          sourceRunId: runId,
          title: `Milestone 완료 보고: ${milestone.title}`.slice(0, 240),
          summary,
          continuationPolicy: "wake_assignee",
          payload: {
            version: 1,
            prompt: `Milestone '${milestone.title}'의 완료 보고를 승인하시겠습니까?`,
            acceptLabel: "승인",
            rejectLabel: "보완 요청",
            rejectRequiresReason: true,
            rejectReasonLabel: "보완이 필요한 이유",
            detailsMarkdown,
            supersedeOnUserComment: false,
            target: {
              type: "custom",
              key: `milestone-report:${state.milestoneId}`,
              revisionId: commitSha,
              label: reportPath,
            },
          },
        }, companyId, { authorAgentId: agentId });
        const report: MilestoneReport = { path: reportPath, commitSha, summary, interactionId: interaction.id };
        await saveDeliveryState(companyId, { ...state, report, phase: "awaiting_human_confirmation" });
        return { interactionId: interaction.id, report, phase: "awaiting_human_confirmation" };
      };

      const recordMilestoneConfirmation = async (
        companyId: string,
        agentId: string,
        runId: string | null,
        params: Record<string, unknown>,
      ) => {
        const goal = await requireGoal(stringParam(params, "goalId"), companyId);
        await requireOrchestrator(agentId, companyId);
        const state = await getDeliveryState(companyId, goal.id);
        if (!state?.milestoneId || !state.rootTaskId || state.phase !== "awaiting_human_confirmation" || !state.report) {
          throw new Error("Milestone is not awaiting a Paperclip confirmation");
        }
        if (stringParam(params, "interactionId") !== state.report.interactionId) {
          throw new Error("interactionId does not match the pending Milestone report");
        }
        const root = await ctx.issues.get(state.rootTaskId, companyId);
        if (!root || root.status !== "in_review" || root.assigneeAgentId !== agentId) {
          throw new Error("Root Task must still be assigned to the workflow orchestrator");
        }
        const decision = params.decision;
        if (decision !== "accepted" && decision !== "rejected") throw new Error("decision must be accepted or rejected");

        // ponytail: the current SDK can create but not read interaction results; trust the configured
        // orchestrator's Paperclip continuation until interaction read/events are added to the SDK.
        if (decision === "accepted") {
          await ctx.issues.update(root.id, { status: "done" }, companyId, { actorAgentId: agentId, actorRunId: runId });
          const milestone = await ctx.goals.update(state.milestoneId, { status: "achieved" }, companyId);
          await saveDeliveryState(companyId, { ...state, phase: "completed" });
          ctx.logger.info("Milestone completed after Paperclip confirmation", {
            companyId,
            goalId: goal.id,
            milestoneId: state.milestoneId,
            interactionId: state.report.interactionId,
          });
          return { decision, milestone };
        }

        const reason = stringParam(params, "reason");
        const assigneeAgentId = stringParam(params, "assigneeAgentId");
        const rootOwnerAgentId = state.rootOwnerAgentId;
        if (!rootOwnerAgentId) throw new Error("Original Root Task owner is unavailable");
        if (assigneeAgentId === rootOwnerAgentId || assigneeAgentId === agentId) {
          throw new Error("Milestone remediation must have an independent executor");
        }
        const assignee = await ctx.agents.get(assigneeAgentId, companyId);
        if (!assignee || assignee.status === "terminated") throw new Error("Remediation assignee must be active");
        const remediation = await ctx.issues.create({
          companyId,
          parentId: root.id,
          goalId: state.milestoneId,
          inheritExecutionWorkspaceFromIssueId: root.id,
          title: `Milestone remediation: ${reason.slice(0, 80)}`,
          description: `## Human rejection\n\n${reason}\n\n- Rejected report: \`${state.report.path}\`\n- Git commit: \`${state.report.commitSha}\``,
          status: "todo",
          priority: root.priority,
          assigneeAgentId,
          originKind: "plugin:local.operation-control:delivery-remediation",
          originId: `${root.id}:human-rejection:${state.rejectionCount + 1}`,
          actor: { actorAgentId: agentId, actorRunId: runId },
        });
        await ctx.state.set(deliveryNodeKey(remediation.id), {
          rootTaskId: root.id,
          goalId: goal.id,
          milestoneId: state.milestoneId,
          parentId: root.id,
        } satisfies DeliveryNode);
        await ctx.issues.update(
          root.id,
          { status: "in_progress", assigneeAgentId: rootOwnerAgentId },
          companyId,
          { actorAgentId: agentId, actorRunId: runId },
        );
        await saveDeliveryState(companyId, {
          ...state,
          report: null,
          phase: "executing",
          rejectionCount: state.rejectionCount + 1,
        });
        await ctx.issues.requestWakeup(remediation.id, companyId, {
          reason: "Board requested Milestone remediation.",
          contextSource: "operation-control:milestone-rejection",
          idempotencyKey: `${remediation.id}:milestone-rejection`,
          actorAgentId: agentId,
          actorRunId: runId,
        });
        return { decision, remediationIssueId: remediation.id, phase: "executing" };
      };

      const deliveryData = async (params: Record<string, unknown>) => {
        const companyId = readCompanyId(params);
        const goalId = stringParam(params, "goalId");
        const state = await getDeliveryState(companyId, goalId);
        const milestone = state?.milestoneId ? await ctx.goals.get(state.milestoneId, companyId) : null;
        const root = state?.rootTaskId ? await ctx.issues.get(state.rootTaskId, companyId) : null;
        return { state, milestone, root };
      };

      const handleIssueCreated = async (event: PluginEvent) => {
        const issueId = event.entityId ?? ((event.payload as Record<string, unknown> | null)?.issueId as string | undefined);
        if (!issueId) return;
        const issue = await ctx.issues.get(issueId, event.companyId);
        if (!issue || !issue.parentId) return;
        const tracked = await getIssueDelivery(event.companyId, issue);
        if (!tracked || event.actorType === "plugin") return;
        await ctx.issues.update(issue.id, { status: "cancelled" }, event.companyId);
        await ctx.issues.createComment(issue.id, "Workflow guard: child Task는 delivery-control plugin을 통해서만 생성할 수 있습니다.", event.companyId);
        ctx.logger.warn("Cancelled an out-of-band child Task", { companyId: event.companyId, issueId });
      };

      const handleIssueUpdated = async (event: PluginEvent) => {
        if (event.actorType === "plugin") return;
        const issueId = event.entityId ?? ((event.payload as Record<string, unknown> | null)?.issueId as string | undefined);
        if (!issueId) return;
        const issue = await ctx.issues.get(issueId, event.companyId);
        if (!issue || issue.status !== "done") return;
        const tracked = await getIssueDelivery(event.companyId, issue);
        if (!tracked || tracked.state.phase === "completed") return;
        if (!(await directChildren(issue.id, event.companyId)).length) return;
        await ctx.issues.update(issue.id, { status: "in_review" }, event.companyId);
        await ctx.issues.createComment(issue.id, "Workflow guard: child가 있는 Node/Root Task는 parent owner review를 거쳐야 완료됩니다.", event.companyId);
        ctx.logger.warn("Reopened an out-of-band parent completion", { companyId: event.companyId, issueId });
      };

      const handleGoalUpdated = async (event: PluginEvent) => {
        const goalId = event.entityId ?? ((event.payload as Record<string, unknown> | null)?.goalId as string | undefined);
        if (!goalId || event.actorType === "plugin") return;
        const marker = await ctx.state.get(deliveryMilestoneKey(goalId));
        if (!isDeliveryState(marker)) return;
        const goal = await ctx.goals.get(goalId, event.companyId);
        if (!goal) return;
        if (marker.phase !== "completed" && goal.status === "achieved") {
          await ctx.goals.update(goalId, { status: marker.phase === "milestone_pending" ? "planned" : "active" }, event.companyId);
          ctx.logger.warn("Reverted an out-of-band Milestone completion", { companyId: event.companyId, goalId });
        }
      };

      ctx.data.register("delivery-control", deliveryData);

      ctx.actions.register("register-goal", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        return serialized(companyId, () => registerGoal(companyId, actorUser(context), params));
      });

      ctx.actions.register("propose-milestone", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        const agentId = actorAgentId(context);
        return serialized(companyId, () => proposeMilestone(companyId, agentId, params));
      });

      ctx.actions.register("confirm-milestone", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        return serialized(companyId, () => confirmMilestone(companyId, actorUser(context), params));
      });

      ctx.actions.register("create-root-task", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        const agentId = actorAgentId(context);
        return serialized(companyId, () => createRootTask(companyId, agentId, context.actor.runId, params));
      });

      ctx.actions.register("create-child-task", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        const agentId = actorAgentId(context);
        return serialized(companyId, () => createChildTask(companyId, agentId, context.actor.runId, params));
      });

      ctx.actions.register("review-node", async (params, context) => {
        const companyId = readCompanyId(params, context.companyId);
        const agentId = actorAgentId(context);
        return serialized(companyId, () => reviewNode(companyId, agentId, context.actor.runId, params));
      });

      ctx.tools.register(
        "propose-milestone",
        {
          displayName: "Propose Milestone",
          description: "Create a Milestone proposal below a registered Goal.",
          parametersSchema: {
            type: "object",
            properties: {
              goalId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["goalId", "title"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => proposeMilestone(
            runContext.companyId,
            runContext.agentId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.tools.register(
        "create-root-task",
        {
          displayName: "Create Root Task",
          description: "Create the Root Task after a human confirms the Milestone.",
          parametersSchema: {
            type: "object",
            properties: {
              goalId: { type: "string" },
              projectId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              assigneeAgentId: { type: "string" },
            },
            required: ["goalId", "title", "assigneeAgentId"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => createRootTask(
            runContext.companyId,
            runContext.agentId,
            runContext.runId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.tools.register(
        "create-child-task",
        {
          displayName: "Create child Task",
          description: "Create a child Task only below the current Agent's owned Node Task.",
          parametersSchema: {
            type: "object",
            properties: {
              parentIssueId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              assigneeAgentId: { type: "string" },
              blockedByIssueIds: { type: "array", items: { type: "string" } },
            },
            required: ["parentIssueId", "title", "assigneeAgentId"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => createChildTask(
            runContext.companyId,
            runContext.agentId,
            runContext.runId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.tools.register(
        "review-node",
        {
          displayName: "Review Node Task",
          description: "Approve or reject a Node Task after all direct child Tasks are terminal.",
          parametersSchema: {
            type: "object",
            properties: {
              issueId: { type: "string" },
              decision: { type: "string", enum: ["approved", "rejected"] },
              reason: { type: "string" },
              assigneeAgentId: { type: "string" },
            },
            required: ["issueId", "decision"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => reviewNode(
            runContext.companyId,
            runContext.agentId,
            runContext.runId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.tools.register(
        "request-milestone-review",
        {
          displayName: "Request Milestone Review",
          description: "Send a Git-backed Milestone completion report to the Board for confirmation.",
          parametersSchema: {
            type: "object",
            properties: {
              goalId: { type: "string" },
              reportPath: { type: "string" },
              commitSha: { type: "string" },
              summary: { type: "string" },
              evidence: { type: "string" },
            },
            required: ["goalId", "reportPath", "commitSha", "summary"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => requestMilestoneReview(
            runContext.companyId,
            runContext.agentId,
            runContext.runId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.tools.register(
        "record-milestone-confirmation",
        {
          displayName: "Record Milestone Confirmation",
          description: "Apply the Board response from a Paperclip Milestone confirmation continuation.",
          parametersSchema: {
            type: "object",
            properties: {
              goalId: { type: "string" },
              interactionId: { type: "string" },
              decision: { type: "string", enum: ["accepted", "rejected"] },
              reason: { type: "string" },
              assigneeAgentId: { type: "string" },
            },
            required: ["goalId", "interactionId", "decision"],
          },
        },
        async (params, runContext: ToolRunContext) => {
          const result = await serialized(runContext.companyId, () => recordMilestoneConfirmation(
            runContext.companyId,
            runContext.agentId,
            runContext.runId,
            params as Record<string, unknown>,
          ));
          return { content: JSON.stringify(result), data: result };
        },
      );

      ctx.events.on("issue.created", (event) => serialized(event.companyId, () => handleIssueCreated(event)));
      ctx.events.on("issue.updated", (event) => serialized(event.companyId, () => handleIssueUpdated(event)));
      ctx.events.on("goal.updated", (event) => serialized(event.companyId, () => handleGoalUpdated(event)));

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
