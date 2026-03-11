import { describe, expect, test } from "bun:test";
import {
  buildDefaultReportQuery,
  ReportCollectionSchema,
  ReportDetailSchema,
  SavedUniverseListSchema,
  SavedUniverseSchema,
  SnapshotListSchema,
} from "@gapdown-radar/contracts";

import { createApp } from "../src/app";

const app = createApp({
  API_PORT: 4001,
  DATA_PROVIDER: "fixture",
  FREE_LIVE_TICKERS: undefined,
  SEC_USER_AGENT: undefined,
  REPORT_WRITER_MODE: "deterministic",
  CODEX_MODEL: "gpt-5.4",
});

const createQueryString = (): string => {
  const query = buildDefaultReportQuery(new Date("2026-03-10T00:00:00.000Z"));
  const searchParameters = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
    minimumDropPct: String(query.minimumDropPct),
    maxReports: String(query.maxReports),
  });

  return searchParameters.toString();
};

describe("GapDown Radar API", () => {
  test("lists validated report summaries", async () => {
    const response = await app.request(`/api/reports?${createQueryString()}`);
    const payload: unknown = await response.json();
    const parsedPayload = ReportCollectionSchema.parse(payload);

    expect(response.status).toBe(200);
    expect(parsedPayload.reports.length).toBeGreaterThanOrEqual(4);
    expect(parsedPayload.reports.every((report) => report.quality.passesGate)).toBe(true);
    expect(parsedPayload.snapshot.reportCount).toBe(parsedPayload.reports.length);
  });

  test("returns a validated detailed report", async () => {
    const listResponse = await app.request(`/api/reports?${createQueryString()}`);
    const listPayload: unknown = await listResponse.json();
    const parsedListPayload = ReportCollectionSchema.parse(listPayload);
    const firstReport = parsedListPayload.reports[0];

    if (firstReport === undefined) {
      throw new Error("Expected at least one report in the collection.");
    }

    const detailResponse = await app.request(
      `/api/reports/${firstReport.reportId}?${createQueryString()}`,
    );
    const detailPayload: unknown = await detailResponse.json();
    const parsedDetailPayload = ReportDetailSchema.parse(detailPayload);

    expect(parsedDetailPayload.watchlist.length).toBeGreaterThanOrEqual(2);
    expect(parsedDetailPayload.citations.length).toBeGreaterThanOrEqual(4);
    expect(parsedDetailPayload.quality.totalScore).toBeGreaterThanOrEqual(80);
    expect(parsedDetailPayload.snapshot.snapshotId.length).toBeGreaterThan(0);
    expect(parsedDetailPayload.tradeRecommendation.label.length).toBeGreaterThan(0);
    expect(parsedDetailPayload.catalysts.length).toBeGreaterThanOrEqual(3);
    expect(parsedDetailPayload.peerComparison.length).toBeGreaterThanOrEqual(3);
    expect(parsedDetailPayload.evidenceTimeline.length).toBeGreaterThanOrEqual(4);
  });

  test("supports a seed ticker query", async () => {
    const query = `${createQueryString()}&seedTicker=EMAT`;
    const response = await app.request(`/api/reports?${query}`);
    const payload: unknown = await response.json();
    const parsedPayload = ReportCollectionSchema.parse(payload);

    expect(response.status).toBe(200);
    expect(parsedPayload.query.seedTicker).toBe("EMAT");
  });

  test("supports saved universes", async () => {
    const universeName = `Fixture Solar ${Date.now()}`;
    const createResponse = await app.request("/api/universes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: universeName,
        kind: "watchlist",
        tickers: ["TQHC", "CLYN", "FLXN", "NCHL"],
        note: "Fixture credit basket",
      }),
    });
    const createPayload: unknown = await createResponse.json();
    const savedUniverse = SavedUniverseSchema.parse(createPayload);

    expect(createResponse.status).toBe(201);

    const listResponse = await app.request("/api/universes");
    const listPayload: unknown = await listResponse.json();
    const universeList = SavedUniverseListSchema.parse(listPayload);

    expect(universeList.universes.some((universe) => universe.id === savedUniverse.id)).toBe(true);

    const query = `${createQueryString()}&universeId=${savedUniverse.id}`;
    const reportResponse = await app.request(`/api/reports?${query}`);
    const reportPayload: unknown = await reportResponse.json();
    const reportCollection = ReportCollectionSchema.parse(reportPayload);

    expect(reportResponse.status).toBe(200);
    expect(reportCollection.query.universeId).toBe(savedUniverse.id);

    const deleteResponse = await app.request(`/api/universes/${savedUniverse.id}`, {
      method: "DELETE",
    });

    expect(deleteResponse.status).toBe(200);
  });

  test("lists persisted snapshots", async () => {
    const collectionResponse = await app.request(`/api/reports?${createQueryString()}`);
    const collectionPayload: unknown = await collectionResponse.json();
    const collection = ReportCollectionSchema.parse(collectionPayload);
    const snapshotsResponse = await app.request("/api/snapshots");
    const snapshotsPayload: unknown = await snapshotsResponse.json();
    const parsedSnapshots = SnapshotListSchema.parse(snapshotsPayload);

    expect(snapshotsResponse.status).toBe(200);
    expect(parsedSnapshots.snapshots.length).toBeGreaterThan(0);

    const archiveResponse = await app.request(`/api/snapshots/${collection.snapshot.snapshotId}`);
    const archivePayload: unknown = await archiveResponse.json();
    const archiveCollection = ReportCollectionSchema.parse(archivePayload);

    expect(archiveResponse.status).toBe(200);
    expect(archiveCollection.snapshot.snapshotId).toBe(collection.snapshot.snapshotId);

    const firstReport = collection.reports[0];

    if (firstReport === undefined) {
      throw new Error("Expected at least one report in the archived snapshot.");
    }

    const archivedDetailResponse = await app.request(
      `/api/snapshots/${collection.snapshot.snapshotId}/reports/${firstReport.reportId}`,
    );
    const archivedDetailPayload: unknown = await archivedDetailResponse.json();
    const archivedDetail = ReportDetailSchema.parse(archivedDetailPayload);

    expect(archivedDetailResponse.status).toBe(200);
    expect(archivedDetail.snapshot.snapshotId).toBe(collection.snapshot.snapshotId);
  });
});
