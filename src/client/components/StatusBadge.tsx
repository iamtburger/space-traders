import type { RunStatus } from "../backend";

const LABELS: Record<RunStatus, string> = {
  running: "Running",
  completed_limit_reached: "Completed",
  stopped: "Stopped",
  errored: "Error",
};

export function StatusBadge({ status }: { status: RunStatus }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status]}</span>;
}
