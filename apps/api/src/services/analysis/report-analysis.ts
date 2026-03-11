import type {
  Catalyst,
  Citation,
  EvidenceTimelineItem,
  PeerComparison,
  ReportDetail,
  ReportSummary,
  RiskDashboard,
  RootCauseCategory,
  TradeRecommendation,
} from "@gapdown-radar/contracts";

import type { CompanyCase, RiskSignal } from "../data/report-provider";

const causeLabels: Record<RootCauseCategory, string> = {
  accountingRisk: "accounting risk",
  liquidityStress: "liquidity stress",
  guidanceCut: "guidance cut",
  marginCompression: "margin compression",
  demandCompression: "demand compression",
  creditDeterioration: "credit deterioration",
  customerConcentration: "customer concentration",
  regulatoryRisk: "regulatory risk",
  trialFailure: "trial failure",
};

type ReportDraft = {
  readonly reportId: string;
  readonly ticker: string;
  readonly companyName: string;
  readonly sector: string;
  readonly eventDate: string;
  readonly dropPct: number;
  readonly primaryCause: RootCauseCategory;
  readonly keySignals: readonly string[];
  readonly riskFactors: readonly string[];
  readonly historicalPattern: string;
  readonly tradeRecommendation: TradeRecommendation;
  readonly riskDashboard: RiskDashboard;
  readonly catalysts: ReadonlyArray<Catalyst>;
  readonly peerComparison: ReadonlyArray<PeerComparison>;
  readonly evidenceTimeline: ReadonlyArray<EvidenceTimelineItem>;
  readonly watchlist: ReportDetail["watchlist"];
  readonly citations: readonly Citation[];
  readonly signalSourceKinds: readonly string[];
};

const pickPrimaryCause = (signals: ReadonlyArray<RiskSignal>): RootCauseCategory => {
  const totals = new Map<RootCauseCategory, number>();

  for (const signal of signals) {
    const current = totals.get(signal.category) ?? 0;

    totals.set(signal.category, current + signal.severity);
  }

  const [winner] = [...totals.entries()].sort((left, right) => right[1] - left[1]);

  if (winner === undefined) {
    throw new Error("Cannot build report without signals.");
  }

  return winner[0];
};

const uniqueById = <T extends { readonly id: string }>(
  items: ReadonlyArray<T>,
): ReadonlyArray<T> => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

const createWatchlist = (
  targetCase: CompanyCase,
  primaryCause: RootCauseCategory,
  universe: ReadonlyArray<CompanyCase>,
): ReportDetail["watchlist"] => {
  const rankedCandidates = universe
    .filter(
      (candidate) =>
        !candidate.hasTriggeredDrop &&
        candidate.reportId !== targetCase.reportId &&
        candidate.ticker !== targetCase.ticker,
    )
    .map((candidate) => {
      const overlappingSignals = candidate.signals.filter((signal) => {
        return (
          signal.category === primaryCause ||
          targetCase.signals.some((targetSignal) => targetSignal.category === signal.category)
        );
      });
      const sharedSignals =
        overlappingSignals.length > 0
          ? overlappingSignals.map((signal) => signal.label)
          : candidate.signals.slice(0, 1).map((signal) => signal.label);
      const similarityScore = Math.min(
        100,
        overlappingSignals.length * 20 + (candidate.sector === targetCase.sector ? 30 : 0) + 10,
      );

      return {
        ticker: candidate.ticker,
        companyName: candidate.companyName,
        similarityScore,
        riskSummary: candidate.summary,
        sharedSignals,
        overlapCount: overlappingSignals.length,
      };
    })
    .sort((left, right) => right.similarityScore - left.similarityScore);
  const strictMatches = rankedCandidates.filter((candidate) => candidate.overlapCount >= 2);

  if (strictMatches.length >= 2) {
    return strictMatches.slice(0, 3).map((candidate) => ({
      ticker: candidate.ticker,
      companyName: candidate.companyName,
      similarityScore: candidate.similarityScore,
      riskSummary: candidate.riskSummary,
      sharedSignals: candidate.sharedSignals,
    }));
  }

  const fallbackMatches = rankedCandidates.filter((candidate) => candidate.overlapCount >= 1);

  if (fallbackMatches.length >= 2) {
    return fallbackMatches.slice(0, 3).map((candidate) => ({
      ticker: candidate.ticker,
      companyName: candidate.companyName,
      similarityScore: candidate.similarityScore,
      riskSummary: candidate.riskSummary,
      sharedSignals: candidate.sharedSignals,
    }));
  }

  return rankedCandidates.slice(0, 3).map((candidate) => ({
    ticker: candidate.ticker,
    companyName: candidate.companyName,
    similarityScore: candidate.similarityScore,
    riskSummary: candidate.riskSummary,
    sharedSignals: candidate.sharedSignals,
  }));
};

const createHistoricalPattern = (
  targetCase: CompanyCase,
  primaryCause: RootCauseCategory,
  universe: ReadonlyArray<CompanyCase>,
): string => {
  const comparableBreaks = universe.filter((candidate) => {
    return (
      candidate.hasTriggeredDrop &&
      candidate.reportId !== targetCase.reportId &&
      candidate.signals.some((signal) => signal.category === primaryCause)
    );
  });

  if (comparableBreaks.length === 0) {
    return "No earlier break in the two-year window shares the full signal stack, so the case stands primarily on its own current fundamentals.";
  }

  const comparables = comparableBreaks
    .slice(0, 2)
    .map((candidate) => `${candidate.ticker} (${candidate.eventDate})`)
    .join(" and ");

  return `The pattern resembles ${comparables}, where the market ignored weakening fundamentals until guidance, liquidity, or credit stress forced a fast re-rating.`;
};

const scoreRisk = (
  signals: ReadonlyArray<RiskSignal>,
  categories: ReadonlyArray<RootCauseCategory>,
): number => {
  const score = signals.reduce((total, signal) => {
    return categories.includes(signal.category) ? total + signal.severity * 10 : total;
  }, 0);

  return Math.min(100, score);
};

const createRiskDashboard = (targetCase: CompanyCase, watchlistCount: number): RiskDashboard => {
  const balanceSheetRisk = scoreRisk(targetCase.signals, ["liquidityStress"]);
  const earningsRisk = scoreRisk(targetCase.signals, ["marginCompression", "guidanceCut"]);
  const demandRisk = scoreRisk(targetCase.signals, ["demandCompression", "customerConcentration"]);
  const accountingRisk = scoreRisk(targetCase.signals, ["accountingRisk"]);
  const dilutionRisk = Math.min(100, Math.round(balanceSheetRisk * 0.7 + earningsRisk * 0.3));
  const timingRisk = Math.min(100, Math.round(targetCase.volumeMultiple * 18 + targetCase.dropPct));
  const crowdingRisk = Math.min(100, Math.round(watchlistCount * 15 + targetCase.dropPct));
  const overallRisk = Math.round(
    balanceSheetRisk * 0.2 +
      earningsRisk * 0.2 +
      demandRisk * 0.2 +
      dilutionRisk * 0.15 +
      timingRisk * 0.15 +
      crowdingRisk * 0.1,
  );

  return {
    overallRisk,
    balanceSheetRisk,
    earningsRisk,
    demandRisk,
    accountingRisk,
    dilutionRisk,
    timingRisk,
    crowdingRisk,
  };
};

const createTradeRecommendation = (
  draft: Pick<ReportDraft, "ticker" | "companyName" | "primaryCause" | "watchlist">,
  targetCase: CompanyCase,
  riskDashboard: RiskDashboard,
): TradeRecommendation => {
  const conviction =
    riskDashboard.overallRisk >= 75 ? "high" : riskDashboard.overallRisk >= 55 ? "medium" : "low";
  const direction = targetCase.dropPct >= 15 ? "watchShort" : "pairsShort";
  const peerTicker = draft.watchlist[0]?.ticker ?? "closest peer";

  return {
    label: direction === "pairsShort" ? "Relative short setup" : "Monitor for renewed downside",
    direction,
    conviction,
    thesis: `${draft.companyName} still screens vulnerable because ${draft.primaryCause} is not yet clearly repaired, while ${peerTicker} offers a cleaner relative benchmark.`,
    entryTrigger: `Enter only if the next filing, earnings update, or guidance commentary confirms that ${draft.primaryCause} remains unresolved.`,
    stopTrigger:
      "Stand down if liquidity, demand, or margin evidence stabilizes materially across the next disclosure cycle.",
    targetView: "Target a fresh re-rating lower versus peers rather than a one-day crash repeat.",
    sizingView: `Keep sizing ${conviction === "high" ? "measured" : "small"} because timing risk remains elevated after the first break.`,
  };
};

const createCatalysts = (targetCase: CompanyCase): ReadonlyArray<Catalyst> => {
  return targetCase.documents.slice(0, 4).map((document, index) => ({
    date: document.date,
    title: document.title,
    type:
      document.kind === "earnings"
        ? "earnings"
        : document.kind === "filing"
          ? "filing"
          : document.kind === "financial"
            ? "financing"
            : document.kind === "market"
              ? "market"
              : "customer",
    significance: index < 2 ? "high" : "medium",
    rationale: document.excerpt,
  }));
};

const createPeerComparison = (
  targetCase: CompanyCase,
  universe: ReadonlyArray<CompanyCase>,
  watchlist: ReportDetail["watchlist"],
): ReadonlyArray<PeerComparison> => {
  const brokenCase: PeerComparison = {
    ticker: targetCase.ticker,
    companyName: targetCase.companyName,
    status: "broken",
    dropPct: targetCase.dropPct,
    similarityScore: 100,
    primaryRisk: targetCase.signals[0]?.label ?? "stress stack active",
    thesisStatus: "Already broken; monitor follow-through and failed recovery attempts.",
  };
  const peers = watchlist.map((candidate) => ({
    ticker: candidate.ticker,
    companyName: candidate.companyName,
    status: "watch" as const,
    dropPct: 0,
    similarityScore: candidate.similarityScore,
    primaryRisk: candidate.sharedSignals[0] ?? "matched fragility",
    thesisStatus: candidate.riskSummary,
  }));
  const extraPeers = universe
    .filter((candidate) => candidate.ticker !== targetCase.ticker && candidate.hasTriggeredDrop)
    .slice(0, 1)
    .map((candidate) => ({
      ticker: candidate.ticker,
      companyName: candidate.companyName,
      status: "broken" as const,
      dropPct: candidate.dropPct,
      similarityScore: 60,
      primaryRisk: candidate.signals[0]?.label ?? "comparable break",
      thesisStatus: candidate.summary,
    }));

  return [brokenCase, ...peers, ...extraPeers].slice(0, 5);
};

const createEvidenceTimeline = (
  citations: ReadonlyArray<Citation>,
): ReadonlyArray<EvidenceTimelineItem> => {
  return [...citations]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((citation) => ({
      date: citation.date,
      kind: citation.kind,
      title: citation.title,
      takeaway: citation.excerpt,
      url: citation.url,
    }));
};

export const createReportDraft = (
  targetCase: CompanyCase,
  universe: ReadonlyArray<CompanyCase>,
): ReportDraft => {
  const primaryCause = pickPrimaryCause(targetCase.signals);
  const citations = uniqueById(targetCase.documents).map((document) => ({ ...document }));
  const watchlist = createWatchlist(targetCase, primaryCause, universe);
  const riskDashboard = createRiskDashboard(targetCase, watchlist.length);

  return {
    reportId: targetCase.reportId,
    ticker: targetCase.ticker,
    companyName: targetCase.companyName,
    sector: targetCase.sector,
    eventDate: targetCase.eventDate,
    dropPct: targetCase.dropPct,
    primaryCause,
    keySignals: targetCase.signals.map((signal) => signal.label),
    riskFactors: targetCase.signals.map((signal) => signal.detail),
    historicalPattern: createHistoricalPattern(targetCase, primaryCause, universe),
    tradeRecommendation: createTradeRecommendation(
      {
        ticker: targetCase.ticker,
        companyName: targetCase.companyName,
        primaryCause,
        watchlist,
      },
      targetCase,
      riskDashboard,
    ),
    riskDashboard,
    catalysts: createCatalysts(targetCase),
    peerComparison: createPeerComparison(targetCase, universe, watchlist),
    evidenceTimeline: createEvidenceTimeline(citations),
    watchlist,
    citations,
    signalSourceKinds: citations.map((citation) => citation.kind),
  };
};

export const createHeadline = (draft: ReportDraft): string => {
  return `${draft.ticker}: ${causeLabels[draft.primaryCause]} drives the ${draft.dropPct.toFixed(1)}% break`;
};

export const createExecutiveSummary = (draft: ReportDraft): string => {
  const [firstRisk, secondRisk, thirdRisk] = draft.riskFactors;

  if (firstRisk === undefined || secondRisk === undefined || thirdRisk === undefined) {
    throw new Error("Reports require at least three risk factors.");
  }

  return `${draft.companyName} broke after a ${causeLabels[draft.primaryCause]} setup became explicit in filings and management commentary. The key pressures were ${firstRisk.toLowerCase()}, ${secondRisk.toLowerCase()}, and ${thirdRisk.toLowerCase()}.`;
};

export const createThesis = (draft: ReportDraft): string => {
  const watchlistTickers = draft.watchlist.map((candidate) => candidate.ticker).join(", ");

  return `The drawdown reads as a fundamental re-pricing rather than a sentiment accident. The same stress stack now appears in ${watchlistTickers}, which have not yet seen a comparable one-day break.`;
};

export type DraftNarrative = Pick<ReportSummary, "headline" | "executiveSummary"> & {
  readonly thesis: string;
};
