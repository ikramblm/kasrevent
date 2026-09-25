import { createApp } from "./app";
import { env } from "./config/env";

// Node treats an unhandled promise rejection as fatal by default — without this, the
// process can die silently (no stack trace in the logs) the moment any async code
// anywhere throws without a .catch, which is very hard to diagnose on a remote host.
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION — the process would otherwise crash silently:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const app = createApp();

// Bind explicitly to all interfaces — required on some container platforms where the
// Node default (unspecified host) doesn't reliably resolve to a publicly reachable bind.
app.listen(env.port, "0.0.0.0", () => {
  console.log(`KasrEvent API listening on 0.0.0.0:${env.port} (${env.nodeEnv})`);
});
