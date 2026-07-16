import { useEffect, useState } from "react";
import {
  usePluginAction,
  usePluginData,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";

type StopPolicy = "drain" | "immediate";
type AgentSummary = {
  id: string;
  name: string;
  title: string | null;
  role: string;
  status: string;
};
type GoalSummary = { id: string; title: string; status: string };
type DeliveryState = {
  goalId: string;
  milestoneId: string | null;
  rootTaskId: string | null;
  orchestratorAgentId?: string | null;
  rootOwnerAgentId?: string | null;
  phase: "goal_registered" | "milestone_pending" | "milestone_confirmed" | "executing" | "awaiting_human_confirmation" | "completed";
  report?: {
    path: string;
    commitSha: string;
    summary: string;
    evidence?: string;
  } | null;
};
type DeliveryData = {
  state: DeliveryState | null;
  goal: GoalSummary | null;
  milestone: GoalSummary | null;
  root: { id: string; title: string; status: string } | null;
};
type ControlData = {
  state: {
    mode: "normal" | "holding" | "maintenance";
    stopPolicy: StopPolicy;
    ownerAgentId: string | null;
    reason: string | null;
  };
  runBudget: {
    windowStartedAt: string;
    count: number;
    limit: number;
  };
  agents: AgentSummary[];
  artifactIssueId: string | null;
  companyGoals: GoalSummary[];
  delivery: DeliveryData | null;
};

const fieldStyle = { display: "grid", gap: 4 } as const;
const inputStyle = { border: "1px solid var(--border)", borderRadius: 6, padding: "7px 9px", background: "var(--background)" } as const;

export function OperationControlWidget({ context }: PluginWidgetProps) {
  const { data, loading, error, refresh } = usePluginData<ControlData>("operation-control", {
    companyId: context.companyId,
  });
  const startMaintenance = usePluginAction("start-maintenance");
  const resumeNormal = usePluginAction("resume-normal");
  const adoptGoal = usePluginAction("adopt-goal");
  const confirmMilestone = usePluginAction("confirm-milestone");
  const recordMilestoneConfirmation = usePluginAction("record-milestone-confirmation");
  const [ownerAgentId, setOwnerAgentId] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [stopPolicy, setStopPolicy] = useState<StopPolicy>("drain");
  const [reason, setReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [remediationAgentId, setRemediationAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const preferred = data.state.ownerAgentId
      ?? data.agents.find((agent) => /\b(?:maintainer|devops|sre|site reliability engineer|tpm|tech(?:nical)? project manager|tech manager)\b/i.test(`${agent.name} ${agent.title ?? ""}`))?.id
      ?? data.agents.find((agent) => agent.status !== "terminated")?.id
      ?? "";
    setOwnerAgentId(preferred);
    setStopPolicy(data.state.stopPolicy);
    setReason(data.state.reason ?? "");
    const selectableGoals = data.companyGoals.filter((goal) => goal.status === "active" || goal.status === "planned");
    setSelectedGoalId((current) => selectableGoals.some((goal) => goal.id === current) ? current : (selectableGoals[0]?.id ?? ""));
    const deliveryState = data.delivery?.state;
    const candidates = data.agents.filter((agent) => (
      !["terminated", "pending_approval", "paused"].includes(agent.status)
      && agent.id !== deliveryState?.rootOwnerAgentId
      && agent.id !== deliveryState?.orchestratorAgentId
    ));
    setRemediationAgentId((current) => candidates.some((agent) => agent.id === current) ? current : (candidates[0]?.id ?? ""));
  }, [data]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div>Loading operation state…</div>;
  if (error || !data) return <div style={{ color: "var(--destructive)" }}>{error?.message ?? "Operation state unavailable"}</div>;

  const runningCount = data.agents.filter(
    (agent) => agent.id !== data.state.ownerAgentId && agent.status === "running",
  ).length;
  const active = data.state.mode !== "normal";
  const delivery = data.delivery;
  const deliveryState = delivery?.state;
  const remediationCandidates = data.agents.filter((agent) => (
    !["terminated", "pending_approval", "paused"].includes(agent.status)
    && agent.id !== deliveryState?.rootOwnerAgentId
    && agent.id !== deliveryState?.orchestratorAgentId
  ));

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <strong>Operation Control</strong>
        <span>{data.state.mode.toUpperCase()}</span>
      </div>

      {data.state.mode === "holding" && (
        <div>{runningCount} agent(s) are finishing their current work.</div>
      )}

      {data.runBudget.limit > 0 && (
        <small>Hourly run budget: {data.runBudget.count} / {data.runBudget.limit}</small>
      )}

      <label style={fieldStyle}>
        <span>Maintenance owner</span>
        <select
          value={ownerAgentId}
          disabled={active || busy}
          onChange={(event) => setOwnerAgentId(event.target.value)}
          style={inputStyle}
        >
          {data.agents.filter((agent) => agent.status !== "terminated").map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}{agent.title ? ` — ${agent.title}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        <span>Stop policy</span>
        <select
          value={stopPolicy}
          disabled={active || busy}
          onChange={(event) => setStopPolicy(event.target.value as StopPolicy)}
          style={inputStyle}
        >
          <option value="drain">Finish current work, then pause</option>
          <option value="immediate">Pause now and cancel current work</option>
        </select>
      </label>

      <label style={fieldStyle}>
        <span>Reason</span>
        <input
          value={reason}
          disabled={active || busy}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Technical debt cleanup"
          style={inputStyle}
        />
      </label>

      {actionError && <div style={{ color: "var(--destructive)" }}>{actionError}</div>}

      {active ? (
        <button
          disabled={busy}
          onClick={() => void run(() => resumeNormal({ companyId: context.companyId }))}
        >
          {busy ? "Resuming…" : "Resume normal operation"}
        </button>
      ) : (
        <button
          disabled={busy || !ownerAgentId}
          onClick={() => void run(() => startMaintenance({
            companyId: context.companyId,
            ownerAgentId,
            stopPolicy,
            reason,
          }))}
        >
          {busy ? "Starting…" : "Start maintenance"}
        </button>
      )}

      {data.artifactIssueId && (
        <small>Artifact issue: {data.artifactIssueId}</small>
      )}

      <hr style={{ width: "100%", border: 0, borderTop: "1px solid var(--border)" }} />

      <div style={{ display: "grid", gap: 10 }}>
        <strong>Controlled delivery</strong>

        {!deliveryState ? (
          <>
            {data.companyGoals.some((goal) => goal.status === "active" || goal.status === "planned") ? (
              <>
                <label style={fieldStyle}>
                  <span>Company Goal</span>
                  <select
                    value={selectedGoalId}
                    disabled={busy}
                    onChange={(event) => setSelectedGoalId(event.target.value)}
                    style={inputStyle}
                  >
                    {data.companyGoals
                      .filter((goal) => goal.status === "active" || goal.status === "planned")
                      .map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                  </select>
                </label>
                <button
                  disabled={busy || !selectedGoalId}
                  onClick={() => void run(() => adoptGoal({ companyId: context.companyId, goalId: selectedGoalId }))}
                >
                  Start controlled delivery
                </button>
              </>
            ) : (
              <small>Create an active company Goal, then return here to put it under delivery control.</small>
            )}
          </>
        ) : (
          <>
            <div>{delivery?.goal?.title ?? deliveryState.goalId}</div>
            <small>Phase: {deliveryState.phase.replaceAll("_", " ")}</small>
            {delivery?.milestone && <small>Milestone: {delivery.milestone.title}</small>}
            {delivery?.root && <small>Root Task: {delivery.root.title} ({delivery.root.status})</small>}

            {deliveryState.phase === "milestone_pending" && (
              <button
                disabled={busy}
                onClick={() => void run(() => confirmMilestone({
                  companyId: context.companyId,
                  goalId: deliveryState.goalId,
                }))}
              >
                Confirm Milestone
              </button>
            )}

            {deliveryState.phase === "awaiting_human_confirmation" && deliveryState.report && (
              <div style={{ display: "grid", gap: 10, padding: 10, border: "1px solid var(--border)", borderRadius: 6 }}>
                <strong>Final Board decision required</strong>
                <small>Report: {deliveryState.report.path}</small>
                <small>Commit: {deliveryState.report.commitSha}</small>
                <div>{deliveryState.report.summary}</div>
                {deliveryState.report.evidence && (
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{deliveryState.report.evidence}</pre>
                )}
                <button
                  disabled={busy}
                  onClick={() => void run(() => recordMilestoneConfirmation({
                    companyId: context.companyId,
                    goalId: deliveryState.goalId,
                    decision: "accepted",
                  }))}
                >
                  Accept and complete Milestone
                </button>
                <label style={fieldStyle}>
                  <span>Rejection reason</span>
                  <input
                    value={rejectionReason}
                    disabled={busy}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={fieldStyle}>
                  <span>Independent remediation executor</span>
                  <select
                    value={remediationAgentId}
                    disabled={busy}
                    onChange={(event) => setRemediationAgentId(event.target.value)}
                    style={inputStyle}
                  >
                    {remediationCandidates.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={busy || !rejectionReason.trim() || !remediationAgentId}
                  onClick={() => void run(() => recordMilestoneConfirmation({
                    companyId: context.companyId,
                    goalId: deliveryState.goalId,
                    decision: "rejected",
                    reason: rejectionReason,
                    assigneeAgentId: remediationAgentId,
                  }))}
                >
                  Reject and create remediation
                </button>
              </div>
            )}

            {deliveryState.phase === "completed" && (
              <small>The Product Steward can now propose the next Milestone under this Goal.</small>
            )}
          </>
        )}
      </div>
    </section>
  );
}
