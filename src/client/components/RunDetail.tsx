import { useEffect, useRef, useState } from "react";
import { api, type JournalEntry, type RunRecord } from "../backend";
import { StatusBadge } from "./StatusBadge";
import { JsonBlock } from "./JsonBlock";

const POLL_INTERVAL_MS = 2000;

interface ParsedReasoning {
  summary?: string;
  thought_process?: string;
  ship_symbol?: string | null;
  current_state?: string | null;
  cooldown_active?: boolean | null;
}

function parseReasoning(text: string | null): ParsedReasoning | null {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as ParsedReasoning) : null;
  } catch {
    return null;
  }
}

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
        <div className="run-detail-header">
          <h2 className="run-detail-title">
            Run {run.id.slice(0, 8)} <StatusBadge status={run.status} />
          </h2>
          <p className="run-detail-meta">
            Model: {run.model} · Steps: {run.totalSteps}/{run.maxSteps}
          </p>
          {run.status === "running" && <button onClick={handleStop}>Stop run</button>}
        </div>
      )}

      <h3>Journal</h3>
      <ol className="journal-list">
        {entries.map((entry) => {
          const reasoning = parseReasoning(entry.reasoningText);
          const summaryText = reasoning?.summary || (reasoning ? null : entry.reasoningText);

          return (
            <li key={entry.id} className={`entry${entry.toolName ? " has-tool" : ""}`}>
              {summaryText ? (
                <p className="entry-summary">{summaryText}</p>
              ) : (
                <p className="entry-summary empty">no summary for this step</p>
              )}

              {reasoning?.thought_process && <p className="entry-thought">{reasoning.thought_process}</p>}

              <div className="entry-meta">
                <span className="badge badge-step">Step {entry.stepNumber}</span>
                {entry.toolName && <span className="badge badge-tool">{entry.toolName}</span>}
                {reasoning?.ship_symbol && <span className="badge badge-ship">{reasoning.ship_symbol}</span>}
                {reasoning?.current_state && <span className="badge badge-state">{reasoning.current_state}</span>}
                {reasoning?.cooldown_active && <span className="badge badge-cooldown">cooldown</span>}
                <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                <span>{entry.tokensUsed} tokens</span>
              </div>

              {(entry.toolArgs != null || entry.toolResult != null) && (
                <div className="entry-payload">
                  <JsonBlock label="args" value={entry.toolArgs} />
                  <JsonBlock label="result" value={entry.toolResult} />
                </div>
              )}
            </li>
          );
        })}
        {entries.length === 0 && <li className="empty-row">no journal entries yet</li>}
      </ol>
    </div>
  );
}
