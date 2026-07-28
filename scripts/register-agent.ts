// One-off CLI: registers a new SpaceTraders agent and prints the token to paste
// into .env as SPACETRADERS_TOKEN. Deliberately standalone (no config/client
// imports) since it runs *before* a token exists.
//
// Usage: npm run register-agent -- <callsign> [faction]
// Example: npm run register-agent -- MY-AGENT COSMIC

const [symbol, faction = "COSMIC"] = process.argv.slice(2);

if (!symbol) {
  console.error("Usage: npm run register-agent -- <callsign> [faction]");
  process.exit(1);
}

const res = await fetch("https://api.spacetraders.io/v2/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ symbol, faction }),
});

const json = await res.json();

if (!res.ok) {
  console.error(`Registration failed (${res.status}):`, json);
  process.exit(1);
}

console.log(`Registered agent "${symbol}" in faction ${faction}.`);
console.log(`\nAdd this to your .env file:\nSPACETRADERS_TOKEN=${json.data.token}\n`);
