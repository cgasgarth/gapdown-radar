import {
  type CreateSavedUniverseInput,
  ReportCollectionSchema,
  ReportDetailSchema,
  ReportSummarySchema,
  type DataMode,
  type ReportCollection,
  type ReportDetail,
  type ReportQuery,
  type ReportSummary,
  type SavedUniverse,
  type SavedUniverseList,
  type SnapshotList,
} from "@gapdown-radar/contracts";

import type { ApiEnvironment } from "./env";
import {
  createExecutiveSummary,
  createHeadline,
  createReportDraft,
  createThesis,
} from "./analysis/report-analysis";
import { scoreReportQuality } from "./analysis/report-quality";
import { createReportDataProvider, type CompanyCase } from "./data/report-provider";
import { writeNarrative } from "./llm/report-writer";
import { FileReportSnapshotStore, type StoredSnapshot } from "./persistence/report-snapshot-store";
import { SqliteUniverseStore } from "./persistence/universe-store";

export interface ReportService {
  listReports(query: ReportQuery): Promise<ReportCollection>;
  getReport(reportId: string, query: ReportQuery): Promise<ReportDetail | null>;
  getSnapshot(snapshotId: string): Promise<ReportCollection | null>;
  getSnapshotReport(snapshotId: string, reportId: string): Promise<ReportDetail | null>;
  listSnapshots(): Promise<SnapshotList>;
  listUniverses(): Promise<SavedUniverseList>;
  createUniverse(input: CreateSavedUniverseInput): Promise<SavedUniverse>;
  deleteUniverse(id: string): Promise<boolean>;
}

const ReportWithoutSnapshotSchema = ReportDetailSchema.omit({ snapshot: true });
type ReportWithoutSnapshot = typeof ReportWithoutSnapshotSchema._type;

const compareReports = (left: CompanyCase, right: CompanyCase): number => {
  if (left.eventDate === right.eventDate) {
    return right.dropPct - left.dropPct;
  }

  return right.eventDate.localeCompare(left.eventDate);
};

const createReport = async (
  companyCase: CompanyCase,
  universe: ReadonlyArray<CompanyCase>,
  environment: ApiEnvironment,
): Promise<ReportWithoutSnapshot> => {
  const draft = createReportDraft(companyCase, universe);
  const narrative = await writeNarrative({
    mode: environment.REPORT_WRITER_MODE,
    model: environment.CODEX_MODEL,
    ticker: draft.ticker,
    companyName: draft.companyName,
    primaryCause: draft.primaryCause,
    riskFactors: draft.riskFactors,
    historicalPattern: draft.historicalPattern,
    watchlistTickers: draft.watchlist.map((candidate) => candidate.ticker),
    fallback: {
      headline: createHeadline(draft),
      executiveSummary: createExecutiveSummary(draft),
      thesis: createThesis(draft),
    },
  });
  const quality = scoreReportQuality({
    citationCount: draft.citations.length,
    watchlistCount: draft.watchlist.length,
    signalCount: draft.keySignals.length,
    sourceKinds: draft.signalSourceKinds,
    headline: narrative.headline,
    executiveSummary: narrative.executiveSummary,
    thesis: narrative.thesis,
  });

  return ReportWithoutSnapshotSchema.parse({
    ...draft,
    headline: narrative.headline,
    executiveSummary: narrative.executiveSummary,
    thesis: narrative.thesis,
    quality,
  });
};

const toSummary = (report: ReportDetail): ReportSummary => {
  return ReportSummarySchema.parse({
    reportId: report.reportId,
    ticker: report.ticker,
    companyName: report.companyName,
    sector: report.sector,
    eventDate: report.eventDate,
    dropPct: report.dropPct,
    primaryCause: report.primaryCause,
    headline: report.headline,
    executiveSummary: report.executiveSummary,
    quality: report.quality,
  });
};

const toCollection = (snapshot: StoredSnapshot): ReportCollection => {
  return ReportCollectionSchema.parse({
    generatedAt: snapshot.metadata.createdAt,
    query: snapshot.metadata.query,
    dataMode: snapshot.metadata.dataMode,
    snapshot: snapshot.metadata,
    reports: snapshot.reports.map((report) => toSummary(report)),
  });
};

const toDataMode = (environment: ApiEnvironment): DataMode => {
  return environment.DATA_PROVIDER === "free-live" ? "freeLive" : "fixture";
};

export const createReportService = (environment: ApiEnvironment): ReportService => {
  const provider = createReportDataProvider(environment);
  const dataMode = toDataMode(environment);
  const snapshotStore = new FileReportSnapshotStore();
  const universeStore = new SqliteUniverseStore();

  const resolveUniverseTickers = (query: ReportQuery): ReadonlyArray<string> | undefined => {
    if (query.universeId === undefined) {
      return undefined;
    }

    const universe = universeStore.getUniverse(query.universeId);

    if (universe === null) {
      throw new Error("Requested universe was not found.");
    }

    return universe.tickers;
  };

  const generateSnapshot = async (query: ReportQuery): Promise<StoredSnapshot> => {
    const universeTickers = resolveUniverseTickers(query);
    const universe = await provider.listCases(query, universeTickers);
    const companyCases = universe
      .filter((companyCase) => companyCase.hasTriggeredDrop)
      .sort(compareReports)
      .slice(0, query.maxReports);
    const reports = await Promise.all(
      companyCases.map((companyCase) => createReport(companyCase, universe, environment)),
    );

    return await snapshotStore.saveSnapshot(dataMode, query, reports);
  };

  return {
    async listReports(query: ReportQuery): Promise<ReportCollection> {
      const snapshot = await generateSnapshot(query);
      return toCollection(snapshot);
    },
    async getReport(reportId: string, query: ReportQuery): Promise<ReportDetail | null> {
      const cachedSnapshot = await snapshotStore.getLatestMatchingSnapshot(dataMode, query);
      const snapshot = cachedSnapshot ?? (await generateSnapshot(query));

      return snapshot.reports.find((candidate) => candidate.reportId === reportId) ?? null;
    },
    async getSnapshot(snapshotId: string): Promise<ReportCollection | null> {
      const snapshot = await snapshotStore.getSnapshot(snapshotId);

      if (snapshot === null) {
        return null;
      }

      return toCollection(snapshot);
    },
    async getSnapshotReport(snapshotId: string, reportId: string): Promise<ReportDetail | null> {
      const snapshot = await snapshotStore.getSnapshot(snapshotId);

      if (snapshot === null) {
        return null;
      }

      return snapshot.reports.find((candidate) => candidate.reportId === reportId) ?? null;
    },
    async listSnapshots(): Promise<SnapshotList> {
      return await snapshotStore.listSnapshots();
    },
    async listUniverses(): Promise<SavedUniverseList> {
      return Promise.resolve(universeStore.listUniverses());
    },
    async createUniverse(input: CreateSavedUniverseInput): Promise<SavedUniverse> {
      return Promise.resolve(universeStore.createUniverse(input));
    },
    async deleteUniverse(id: string): Promise<boolean> {
      return Promise.resolve(universeStore.deleteUniverse(id));
    },
  };
};
