import { useState } from "react";
import { RunList } from "./components/RunList";
import { RunDetail } from "./components/RunDetail";

export function App() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>SpaceTraders Agent Monitor</h1>
      {selectedRunId ? (
        <RunDetail runId={selectedRunId} onBack={() => setSelectedRunId(null)} />
      ) : (
        <RunList onSelect={setSelectedRunId} />
      )}
    </main>
  );
}
