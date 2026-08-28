import { useState } from "react";
import { RunList } from "./components/RunList";
import { RunDetail } from "./components/RunDetail";

export function App() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  return (
    <div className="crt">
      <main className="terminal">
        <div className="terminal-titlebar">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
          <span className="terminal-title">spacetraders@agent-monitor:~$</span>
        </div>
        <div className="terminal-body">
          <h1 className="terminal-heading">
            SpaceTraders Agent Monitor <span className="cursor-blink">_</span>
          </h1>
          {selectedRunId ? (
            <RunDetail runId={selectedRunId} onBack={() => setSelectedRunId(null)} />
          ) : (
            <RunList onSelect={setSelectedRunId} />
          )}
        </div>
      </main>
    </div>
  );
}
