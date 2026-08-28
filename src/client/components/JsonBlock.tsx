const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

const TOKEN_PATTERN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function highlightJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2) ?? "null";
  // Tokenize the raw JSON (strings are only recognizable by their literal
  // quotes) and escape each token individually — the unmatched surrounding
  // text is pure JSON structure ({}[]:, and whitespace), which never
  // contains HTML-special characters, so it's safe to leave as-is.
  return json.replace(TOKEN_PATTERN, (match) => {
    let cls = "json-number";
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? "json-key" : "json-string";
    } else if (/^(true|false)$/.test(match)) {
      cls = "json-boolean";
    } else if (match === "null") {
      cls = "json-null";
    }
    return `<span class="${cls}">${escapeHtml(match)}</span>`;
  });
}

export function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null;
  return (
    <div className="json-block">
      <div className="json-block-label">{label}</div>
      <pre className="json-pre">
        <code dangerouslySetInnerHTML={{ __html: highlightJson(value) }} />
      </pre>
    </div>
  );
}
