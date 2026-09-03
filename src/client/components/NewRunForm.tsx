import { useState } from "react";
import { api } from "../backend";

export function NewRunForm({
  onStarted,
}: {
  onStarted: (runId: string) => void;
}) {
  const [maxSteps, setMaxSteps] = useState(25);
  const [model, setModel] = useState("gpt-5.6-luna");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const run = await api.createRun({ maxSteps, model });
      onStarted(run.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="new-run-form" onSubmit={handleSubmit}>
      <label>
        Max steps
        <br />
        <input
          type="number"
          min={1}
          value={maxSteps}
          onChange={(e) => setMaxSteps(Number(e.target.value))}
        />
      </label>
      <label>
        Model
        <br />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          size={28}
          placeholder="provider:modelId, e.g. openai:gpt-4o-mini"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Starting…" : "Start run"}
      </button>
      {error && <span className="error-text">{error}</span>}
    </form>
  );
}
