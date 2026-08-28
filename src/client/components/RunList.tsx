import { useEffect, useState } from "react";
import { api, type RunRecord } from "../backend";
import { NewRunForm } from "./NewRunForm";

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
      <h2>Start a new run</h2>
      <NewRunForm onStarted={onSelect} />

      <h2 style={{ marginTop: "2rem" }}>Runs</h2>
      <table cellPadding={6} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #888" }}>
            <th>Started</th>
            <th>Status</th>
            <th>Model</th>
            <th>Steps</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{new Date(run.startedAt).toLocaleString()}</td>
              <td>{run.status}</td>
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
              <td colSpan={5}>No runs yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
