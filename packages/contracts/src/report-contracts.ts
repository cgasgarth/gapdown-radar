import { z } from "zod";

export const MAX_HISTORY_DAYS = 731;
export const DEFAULT_MINIMUM_DROP_PCT = 10;
export const DEFAULT_MAX_REPORTS = 8;
export const DataModeSchema = z.enum(["fixture", "freeLive"]);

export const RootCauseCategorySchema = z.enum([
  "accountingRisk",
  "liquidityStress",
  "guidanceCut",
  "marginCompression",
  "demandCompression",
  "creditDeterioration",
  "customerConcentration",
  "regulatoryRisk",
  "trialFailure",
]);

export const CitationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["filing", "earnings", "financial", "market", "news"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  url: z.string().min(1),
});

export const QualityAssessmentSchema = z.object({
  totalScore: z.number().min(0).max(100),
  evidenceBreadthScore: z.number().min(0).max(100),
  specificityScore: z.number().min(0).max(100),
  watchlistScore: z.number().min(0).max(100),
  toneScore: z.number().min(0).max(100),
  passesGate: z.boolean(),
  gateNotes: z.array(z.string().min(1)),
});

export const TradeDirectionSchema = z.enum(["short", "pairsShort", "watchShort", "avoidLong"]);
export const TradeConvictionSchema = z.enum(["low", "medium", "high"]);
export const UniverseKindSchema = z.enum(["universe", "watchlist"]);

export const TradeRecommendationSchema = z.object({
  label: z.string().min(1),
  direction: TradeDirectionSchema,
  conviction: TradeConvictionSchema,
  thesis: z.string().min(1),
  entryTrigger: z.string().min(1),
  stopTrigger: z.string().min(1),
  targetView: z.string().min(1),
  sizingView: z.string().min(1),
});

export const RiskDashboardSchema = z.object({
  overallRisk: z.number().min(0).max(100),
  balanceSheetRisk: z.number().min(0).max(100),
  earningsRisk: z.number().min(0).max(100),
  demandRisk: z.number().min(0).max(100),
  accountingRisk: z.number().min(0).max(100),
  dilutionRisk: z.number().min(0).max(100),
  timingRisk: z.number().min(0).max(100),
  crowdingRisk: z.number().min(0).max(100),
});

export const CatalystSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  type: z.enum(["earnings", "filing", "financing", "customer", "market"]),
  significance: z.enum(["high", "medium", "low"]),
  rationale: z.string().min(1),
});

export const PeerComparisonSchema = z.object({
  ticker: z.string().min(1),
  companyName: z.string().min(1),
  status: z.enum(["broken", "watch"]),
  dropPct: z.number().min(0),
  similarityScore: z.number().min(0).max(100),
  primaryRisk: z.string().min(1),
  thesisStatus: z.string().min(1),
});

export const EvidenceTimelineItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["filing", "earnings", "financial", "market", "news"]),
  title: z.string().min(1),
  takeaway: z.string().min(1),
  url: z.string().min(1),
});

export const SavedUniverseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: UniverseKindSchema,
  tickers: z.array(z.string().min(1)).min(1),
  note: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SavedUniverseListSchema = z.object({
  generatedAt: z.string().datetime(),
  universes: z.array(SavedUniverseSchema),
});

export const CreateSavedUniverseInputSchema = z.object({
  name: z.string().min(1).max(80),
  kind: UniverseKindSchema,
  tickers: z.array(z.string().min(1).max(10)).min(1),
  note: z.string().min(1).max(240).optional(),
});

export const SnapshotMetadataSchema = z.object({
  snapshotId: z.string().min(1),
  createdAt: z.string().datetime(),
  dataMode: DataModeSchema,
  reportCount: z.number().int().min(0),
  storageKey: z.string().min(1),
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    minimumDropPct: z.number().int().min(10).max(60),
    maxReports: z.number().int().min(1).max(25),
    seedTicker: z.string().min(1).max(10).optional(),
    universeId: z.string().min(1).optional(),
  }),
});

const reportCoreShape = {
  reportId: z.string().min(1),
  ticker: z.string().min(1),
  companyName: z.string().min(1),
  sector: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dropPct: z.number().positive(),
  primaryCause: RootCauseCategorySchema,
  headline: z.string().min(1),
  executiveSummary: z.string().min(1),
  quality: QualityAssessmentSchema,
};

export const ReportSummarySchema = z.object({
  ...reportCoreShape,
});

export const ReportDetailSchema = z.object({
  ...reportCoreShape,
  thesis: z.string().min(1),
  tradeRecommendation: TradeRecommendationSchema,
  riskDashboard: RiskDashboardSchema,
  keySignals: z.array(z.string().min(1)).min(3),
  riskFactors: z.array(z.string().min(1)).min(3),
  historicalPattern: z.string().min(1),
  catalysts: z.array(CatalystSchema).min(3),
  peerComparison: z.array(PeerComparisonSchema).min(3),
  evidenceTimeline: z.array(EvidenceTimelineItemSchema).min(4),
  watchlist: z
    .array(
      z.object({
        ticker: z.string().min(1),
        companyName: z.string().min(1),
        similarityScore: z.number().min(0).max(100),
        riskSummary: z.string().min(1),
        sharedSignals: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(2),
  citations: z.array(CitationSchema).min(4),
  snapshot: SnapshotMetadataSchema,
});

export const ReportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minimumDropPct: z.number().int().min(10).max(60),
  maxReports: z.number().int().min(1).max(25),
  seedTicker: z.string().min(1).max(10).optional(),
  universeId: z.string().min(1).optional(),
});

export const ReportCollectionSchema = z.object({
  generatedAt: z.string().datetime(),
  query: ReportQuerySchema,
  dataMode: DataModeSchema,
  snapshot: SnapshotMetadataSchema,
  reports: z.array(ReportSummarySchema),
});

export const SnapshotListSchema = z.object({
  generatedAt: z.string().datetime(),
  snapshots: z.array(SnapshotMetadataSchema),
});

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type Catalyst = z.infer<typeof CatalystSchema>;
export type DataMode = z.infer<typeof DataModeSchema>;
export type EvidenceTimelineItem = z.infer<typeof EvidenceTimelineItemSchema>;
export type PeerComparison = z.infer<typeof PeerComparisonSchema>;
export type QualityAssessment = z.infer<typeof QualityAssessmentSchema>;
export type RiskDashboard = z.infer<typeof RiskDashboardSchema>;
export type CreateSavedUniverseInput = z.infer<typeof CreateSavedUniverseInputSchema>;
export type ReportCollection = z.infer<typeof ReportCollectionSchema>;
export type ReportDetail = z.infer<typeof ReportDetailSchema>;
export type ReportQuery = z.infer<typeof ReportQuerySchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type RootCauseCategory = z.infer<typeof RootCauseCategorySchema>;
export type SavedUniverse = z.infer<typeof SavedUniverseSchema>;
export type SavedUniverseList = z.infer<typeof SavedUniverseListSchema>;
export type SnapshotList = z.infer<typeof SnapshotListSchema>;
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;
export type TradeConviction = z.infer<typeof TradeConvictionSchema>;
export type TradeDirection = z.infer<typeof TradeDirectionSchema>;
export type TradeRecommendation = z.infer<typeof TradeRecommendationSchema>;
export type UniverseKind = z.infer<typeof UniverseKindSchema>;

export const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

const subtractDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
};

export const buildDefaultReportQuery = (now: Date): ReportQuery => {
  const endDate = toIsoDate(now);
  const startDate = toIsoDate(subtractDays(now, MAX_HISTORY_DAYS));

  return {
    startDate,
    endDate,
    minimumDropPct: DEFAULT_MINIMUM_DROP_PCT,
    maxReports: DEFAULT_MAX_REPORTS,
  };
};
