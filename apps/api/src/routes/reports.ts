import {
  ApiErrorSchema,
  CreateSavedUniverseInputSchema,
  DEFAULT_MAX_REPORTS,
  DEFAULT_MINIMUM_DROP_PCT,
  MAX_HISTORY_DAYS,
  ReportQuerySchema,
  buildDefaultReportQuery,
  toIsoDate,
  type ReportQuery,
} from "@gapdown-radar/contracts";
import { Hono } from "hono";
import { z } from "zod";

import type { ReportService } from "../services/report-service";

const RequestQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minimumDropPct: z.coerce.number().int().optional(),
  maxReports: z.coerce.number().int().optional(),
  seedTicker: z.string().trim().toUpperCase().optional(),
  universeId: z.string().trim().optional(),
});

const millisecondsPerDay = 1000 * 60 * 60 * 24;

const createQuery = (rawQuery: Record<string, string | undefined>): ReportQuery => {
  const parsed = RequestQuerySchema.parse(rawQuery);
  const defaults = buildDefaultReportQuery(new Date());
  const query = ReportQuerySchema.parse({
    startDate: parsed.startDate ?? defaults.startDate,
    endDate: parsed.endDate ?? defaults.endDate,
    minimumDropPct: parsed.minimumDropPct ?? DEFAULT_MINIMUM_DROP_PCT,
    maxReports: parsed.maxReports ?? DEFAULT_MAX_REPORTS,
    ...(parsed.seedTicker === undefined || parsed.seedTicker.length === 0
      ? {}
      : { seedTicker: parsed.seedTicker }),
    ...(parsed.universeId === undefined || parsed.universeId.length === 0
      ? {}
      : { universeId: parsed.universeId }),
  });
  const start = new Date(`${query.startDate}T00:00:00.000Z`);
  const end = new Date(`${query.endDate}T00:00:00.000Z`);
  const now = new Date();
  const today = new Date(`${toIsoDate(now)}T23:59:59.999Z`);
  const daySpan = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay);

  if (start > end) {
    throw new Error("startDate must be on or before endDate.");
  }

  if (daySpan > MAX_HISTORY_DAYS) {
    throw new Error(`Requested history exceeds ${MAX_HISTORY_DAYS} days.`);
  }

  if (end > today) {
    throw new Error("endDate cannot be in the future.");
  }

  return query;
};

const errorResponse = (message: string): z.infer<typeof ApiErrorSchema> => {
  const payload = ApiErrorSchema.parse({
    code: "invalid_request",
    message,
  });

  return payload;
};

export const createReportsRouter = (reportService: ReportService): Hono => {
  const router = new Hono();

  router.get("/reports", async (context) => {
    try {
      const query = createQuery(context.req.query());
      const collection = await reportService.listReports(query);

      return context.json(collection);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.get("/reports/:reportId", async (context) => {
    try {
      const query = createQuery(context.req.query());
      const report = await reportService.getReport(context.req.param("reportId"), query);

      if (report === null) {
        return context.json(errorResponse("Report not found."), 404);
      }

      return context.json(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.get("/snapshots", async (context) => {
    try {
      return context.json(await reportService.listSnapshots());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.get("/snapshots/:snapshotId", async (context) => {
    try {
      const snapshot = await reportService.getSnapshot(context.req.param("snapshotId"));

      if (snapshot === null) {
        return context.json(errorResponse("Snapshot not found."), 404);
      }

      return context.json(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.get("/snapshots/:snapshotId/reports/:reportId", async (context) => {
    try {
      const report = await reportService.getSnapshotReport(
        context.req.param("snapshotId"),
        context.req.param("reportId"),
      );

      if (report === null) {
        return context.json(errorResponse("Snapshot report not found."), 404);
      }

      return context.json(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.get("/universes", async (context) => {
    try {
      return context.json(await reportService.listUniverses());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.post("/universes", async (context) => {
    try {
      const payload: unknown = await context.req.json();
      const input = CreateSavedUniverseInputSchema.parse(payload);

      return context.json(await reportService.createUniverse(input), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  router.delete("/universes/:universeId", async (context) => {
    try {
      const deleted = await reportService.deleteUniverse(context.req.param("universeId"));

      if (!deleted) {
        return context.json(errorResponse("Universe not found."), 404);
      }

      return context.json({ deleted: true as const });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown request error.";

      return context.json(errorResponse(message), 400);
    }
  });

  return router;
};
