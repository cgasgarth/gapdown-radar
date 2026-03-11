import { Hono } from "hono";
import { cors } from "hono/cors";

import type { ApiEnvironment } from "./services/env";
import { createReportsRouter } from "./routes/reports";
import { createReportService } from "./services/report-service";

export const createApp = (environment: ApiEnvironment): Hono => {
  const app = new Hono();
  const reportService = createReportService(environment);

  app.use("/api/*", cors());
  app.get("/api/health", (context) => {
    return context.json({ status: "ok" as const });
  });
  app.route("/api", createReportsRouter(reportService));

  return app;
};
