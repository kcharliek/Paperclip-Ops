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
  status: string;
};
type ControlData = {
  state: {
    mode: "normal" | "holding" | "maintenance";
    stopPolicy: StopPolicy;
    ownerAgentId: string | null;
    reason: string | null;
  };
  agents: AgentSummary[];
  artifactIssueId: string | null;
};

const fieldStyle = { display: "grid", gap: 4 } as const;
const inputStyle = { border: "1px solid var(--border)", borderRadius: 6, padding: "7px 9px", background: "var(--background)" } as const;

export function OperationControlWidget({ context }: PluginWidgetProps) {
  const { data, loading, error, refresh } = usePluginData<ControlData>("operation-control", {
    companyId: context.companyId,
  });
  const startMaintenance = usePluginAction("start-maintenance");
  const resumeNormal = usePluginAction("resume-normal");
  const [ownerAgentId, setOwnerAgentId] = useState("");
  const [stopPolicy, setStopPolicy] = useState<StopPolicy>("drain");
  const [reason, setReason] = useState("");
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

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <strong>Operation Control</strong>
        <span>{data.state.mode.toUpperCase()}</span>
      </div>

      {data.state.mode === "holding" && (
        <div>{runningCount} agent(s) are finishing their current work.</div>
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
    </section>
  );
}
