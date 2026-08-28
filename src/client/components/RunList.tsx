import { useEffect, useState } from "react";
import { api, type RunRecord } from "../backend";
import { NewRunForm } from "./NewRunForm";
import { StatusBadge } from "./StatusBadge";

const POLL_INTERVAL_MS = 3000;

export function RunList({ onSelect }: { onSelect: (runId: string) => void }) {
  const [runs, setRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const data = await api.listRuns();
        if (!cancelled) setRuns(data);
      } catch {
        // transient fetch errors are ignored; next poll retries
      }
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <div className="panel">
        <div className="panel-label">New run</div>
        <NewRunForm onStarted={onSelect} />
      </div>

      <h2>Runs</h2>
      <table className="run-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Status</th>
            <th>Model</th>
            <th>Steps</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>{new Date(run.startedAt).toLocaleString()}</td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>{run.model}</td>
              <td>
                {run.totalSteps} / {run.maxSteps}
              </td>
              <td>
                <button onClick={() => onSelect(run.id)}>View</button>
              </td>
            </tr>
          ))}
          {runs.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                no runs yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
