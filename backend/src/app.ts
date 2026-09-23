import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errors";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import sallesRoutes from "./modules/salles/salles.routes";
import reservationsRoutes from "./modules/reservations/reservations.routes";
import invitesRoutes from "./modules/invites/invites.routes";
import checkinRoutes from "./modules/checkin/checkin.routes";
import confiscationsRoutes from "./modules/confiscations/confiscations.routes";
import servicesTablesRoutes from "./modules/servicesTables/servicesTables.routes";
import chargesRoutes from "./modules/charges/charges.routes";
import fournisseursRoutes from "./modules/fournisseurs/fournisseurs.routes";
import traiteursRoutes from "./modules/traiteurs/traiteurs.routes";
import employesRoutes from "./modules/employes/employes.routes";
import historiquePaieRoutes from "./modules/historiquePaie/historiquePaie.routes";
import decorationsRoutes from "./modules/decorations/decorations.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import demandesReservationRoutes from "./modules/demandesReservation/demandesReservation.routes";
import reponsesInvitationRoutes from "./modules/reponsesInvitation/reponsesInvitation.routes";
import adminConfigRoutes from "./modules/adminConfig/adminConfig.routes";
import publicRoutes from "./modules/public/public.routes";

export function createApp() {
  const app = express();

  // Security headers, CORS allow-list, and a generous global rate limit (specific
  // sensitive routes — login, public intake — carry their own tighter limits).
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  app.use(express.json({ limit: "2mb" }));
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/salles", sallesRoutes);
  app.use("/api/reservations", reservationsRoutes);
  app.use("/api/invites", invitesRoutes);
  app.use("/api/checkin", checkinRoutes);
  app.use("/api/confiscations", confiscationsRoutes);
  app.use("/api/services-tables", servicesTablesRoutes);
  app.use("/api/charges", chargesRoutes);
  app.use("/api/fournisseurs", fournisseursRoutes);
  app.use("/api/traiteurs", traiteursRoutes);
  app.use("/api/employes", employesRoutes);
  app.use("/api/historique-paie", historiquePaieRoutes);
  app.use("/api/decorations", decorationsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/demandes-reservation", demandesReservationRoutes);
  app.use("/api/reponses-invitation", reponsesInvitationRoutes);
  app.use("/api/admin-config", adminConfigRoutes);
  app.use("/api/public", publicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
