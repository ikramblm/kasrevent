import cron from "node-cron";
import { createApp } from "./app";
import { env } from "./config/env";
import { runMonthlyPayroll } from "./modules/employes/payroll";

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

// Reproduces the original app's "Paie mensuelle" Bot as an actual daily schedule (the
// export never had the real Bot trigger, so this was previously an Admin-triggered button
// only — see docs/ASSUMPTIONS.md #7). Runs once a day at 03:00 server time; each employee's
// own `jourDePaie` still decides whether *they* are actually due that day.
cron.schedule("0 3 * * *", () => {
  runMonthlyPayroll()
    .then((updated) => {
      if (updated.length > 0) console.log(`Monthly payroll cron: paid ${updated.length} employee(s).`);
    })
    .catch((err) => console.error("Monthly payroll cron failed:", err));
});
