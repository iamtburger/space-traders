import "dotenv/config";
import path from "node:path";
import express from "express";
import { config } from "./config";
import "./db"; // runs migrations as a side effect
import { runsRouter } from "./routes/runs";

const app = express();
app.use(express.json());

app.use("/api/runs", runsRouter);

const clientDist = path.join(process.cwd(), "dist/client");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).send("Client build not found. Run `npm run build` or `npm run dev:client`.");
  });
});

app.listen(config.PORT, () => {
  console.log(`Server listening on http://localhost:${config.PORT}`);
});
