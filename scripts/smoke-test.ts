import {
  buildDefaultReportQuery,
  ReportCollectionSchema,
  ReportDetailSchema,
  SavedUniverseSchema,
  SnapshotListSchema,
} from "../packages/contracts/src";

import { createApp } from "../apps/api/src/app";

const app = createApp({
  API_PORT: 4001,
  DATA_PROVIDER: "fixture",
  FREE_LIVE_TICKERS: undefined,
  SEC_USER_AGENT: undefined,
  REPORT_WRITER_MODE: "deterministic",
  CODEX_MODEL: "gpt-5.4",
});
const query = buildDefaultReportQuery(new Date("2026-03-10T00:00:00.000Z"));
const queryString = new URLSearchParams({
  startDate: query.startDate,
  endDate: query.endDate,
  minimumDropPct: String(query.minimumDropPct),
  maxReports: String(query.maxReports),
}).toString();

const collectionResponse = await app.request(`/api/reports?${queryString}`);
const collectionPayload: unknown = await collectionResponse.json();
const collection = ReportCollectionSchema.parse(collectionPayload);

if (collection.reports.length < 4) {
  throw new Error("Smoke test expected at least four reports.");
}

if (collection.snapshot.reportCount !== collection.reports.length) {
  throw new Error("Smoke test expected snapshot metadata to match report count.");
}

for (const report of collection.reports) {
  if (report.quality.totalScore < 80) {
    throw new Error(`Smoke test failed quality gate for ${report.ticker}.`);
  }

  const detailResponse = await app.request(`/api/reports/${report.reportId}?${queryString}`);
  const detailPayload: unknown = await detailResponse.json();
  const detail = ReportDetailSchema.parse(detailPayload);

  if (detail.watchlist.length < 2) {
    throw new Error(`Smoke test expected watchlist depth for ${detail.ticker}.`);
  }

  if (detail.citations.length < 4) {
    throw new Error(`Smoke test expected citation coverage for ${detail.ticker}.`);
  }

  if (detail.catalysts.length < 3 || detail.peerComparison.length < 3) {
    throw new Error(`Smoke test expected richer research sections for ${detail.ticker}.`);
  }
}

const snapshotsResponse = await app.request("/api/snapshots");
const snapshotsPayload: unknown = await snapshotsResponse.json();
const snapshots = SnapshotListSchema.parse(snapshotsPayload);

if (snapshots.snapshots.length === 0) {
  throw new Error("Smoke test expected at least one persisted snapshot.");
}

const archivedCollectionResponse = await app.request(
  `/api/snapshots/${collection.snapshot.snapshotId}`,
);
const archivedCollectionPayload: unknown = await archivedCollectionResponse.json();
const archivedCollection = ReportCollectionSchema.parse(archivedCollectionPayload);

if (archivedCollection.snapshot.snapshotId !== collection.snapshot.snapshotId) {
  throw new Error("Smoke test expected archived snapshot lookup to return the same snapshot.");
}

const firstArchivedReport = archivedCollection.reports[0];

if (firstArchivedReport === undefined) {
  throw new Error("Smoke test expected at least one archived report.");
}

const archivedDetailResponse = await app.request(
  `/api/snapshots/${collection.snapshot.snapshotId}/reports/${firstArchivedReport.reportId}`,
);
const archivedDetailPayload: unknown = await archivedDetailResponse.json();
const archivedDetail = ReportDetailSchema.parse(archivedDetailPayload);

if (archivedDetail.snapshot.snapshotId !== collection.snapshot.snapshotId) {
  throw new Error("Smoke test expected archived detail lookup to stay within the same snapshot.");
}

const universeResponse = await app.request("/api/universes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: `Smoke Universe ${Date.now()}`,
    kind: "universe",
    tickers: ["TQHC", "CLYN", "FLXN", "NCHL"],
  }),
});
const universePayload: unknown = await universeResponse.json();
const savedUniverse = SavedUniverseSchema.parse(universePayload);
const universeQueryString = new URLSearchParams({
  startDate: query.startDate,
  endDate: query.endDate,
  minimumDropPct: String(query.minimumDropPct),
  maxReports: String(query.maxReports),
  universeId: savedUniverse.id,
}).toString();
const universeReportResponse = await app.request(`/api/reports?${universeQueryString}`);
const universeReportPayload: unknown = await universeReportResponse.json();
const universeCollection = ReportCollectionSchema.parse(universeReportPayload);

if (universeCollection.query.universeId !== savedUniverse.id) {
  throw new Error("Smoke test expected saved universe filtering to be applied.");
}

console.log(`Smoke test passed for ${collection.reports.length} reports.`);
