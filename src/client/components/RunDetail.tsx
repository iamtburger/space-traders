import { useEffect, useRef, useState } from "react";
import { api, type JournalEntry, type RunRecord } from "../backend";

const POLL_INTERVAL_MS = 2000;

export function RunDetail({ runId, onBack }: { runId: string; onBack: () => void }) {
  const [run, setRun] = useState<RunRecord | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const lastIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setEntries([]);
    lastIdRef.current = 0;

    async function poll() {
      try {
        const [runData, newEntries] = await Promise.all([
          api.getRun(runId),
          api.listJournalSince(runId, lastIdRef.current),
        ]);
        if (cancelled) return;
        setRun(runData);
        if (newEntries.length > 0) {
          lastIdRef.current = newEntries[newEntries.length - 1].id;
          setEntries((prev) => [...prev, ...newEntries]);
        }
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
  }, [runId]);

  async function handleStop() {
    await api.stopRun(runId);
  }

  return (
    <div>
      <button onClick={onBack}>&larr; Back to runs</button>
      {run && (
        <div style={{ margin: "1rem 0" }}>
          <h2>
            Run {run.id.slice(0, 8)} — {run.status}
          </h2>
          <p>
            Model: {run.model} · Steps: {run.totalSteps}/{run.maxSteps} · Cost: $
            {run.totalCostUsd.toFixed(4)}/${run.maxCostUsd.toFixed(2)}
          </p>
          {run.status === "running" && <button onClick={handleStop}>Stop run</button>}
        </div>
      )}

      <h3>Journal</h3>
      <ol style={{ padding: 0, listStyle: "none" }}>
        {entries.map((entry) => (
          <li key={entry.id} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: "bold" }}>
              Step {entry.stepNumber} — {entry.toolName ?? "(no tool call)"}
            </div>
            {entry.reasoningText && <p style={{ fontStyle: "italic" }}>{entry.reasoningText}</p>}
            {entry.toolArgs != null && (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85em" }}>
                args: {JSON.stringify(entry.toolArgs)}
              </pre>
            )}
            {entry.toolResult != null && (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85em" }}>
                result: {JSON.stringify(entry.toolResult)}
              </pre>
            )}
            <div style={{ fontSize: "0.8em", color: "#666" }}>
              {entry.tokensUsed} tokens · ${entry.costUsd.toFixed(5)}
            </div>
          </li>
        ))}
        {entries.length === 0 && <li>No journal entries yet.</li>}
      </ol>
    </div>
  );
}
