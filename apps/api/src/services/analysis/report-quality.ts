import type { QualityAssessment } from "@gapdown-radar/contracts";

type QualityInput = {
  readonly citationCount: number;
  readonly watchlistCount: number;
  readonly signalCount: number;
  readonly sourceKinds: readonly string[];
  readonly headline: string;
  readonly executiveSummary: string;
  readonly thesis: string;
};

const forbiddenTerms = ["moon", "diamond hands", "YOLO", "apes", "bagholder"];

const includesForbiddenLanguage = (value: string): boolean => {
  return forbiddenTerms.some((term) => value.toLowerCase().includes(term.toLowerCase()));
};

export const scoreReportQuality = (input: QualityInput): QualityAssessment => {
  const uniqueSourceKinds = new Set(input.sourceKinds);
  const evidenceBreadthScore = Math.min(uniqueSourceKinds.size * 25, 100);
  const specificityScore = Math.min(input.signalCount * 20 + input.citationCount * 5, 100);
  const watchlistScore = Math.min(input.watchlistCount * 40, 100);
  const tonePenalty =
    includesForbiddenLanguage(input.headline) ||
    includesForbiddenLanguage(input.executiveSummary) ||
    includesForbiddenLanguage(input.thesis)
      ? 40
      : 0;
  const toneScore = 100 - tonePenalty;
  const totalScore = Math.round(
    evidenceBreadthScore * 0.3 + specificityScore * 0.3 + watchlistScore * 0.2 + toneScore * 0.2,
  );
  const gateNotes = [
    uniqueSourceKinds.size >= 4
      ? "Evidence breadth meets the four-source minimum."
      : "Add broader evidence coverage.",
    input.watchlistCount >= 2
      ? "Watchlist depth meets the minimum."
      : "Add more undropped peer matches.",
    tonePenalty === 0 ? "Tone remains sober and institutional." : "Remove promotional language.",
  ];

  return {
    totalScore,
    evidenceBreadthScore,
    specificityScore,
    watchlistScore,
    toneScore,
    passesGate: totalScore >= 80 && uniqueSourceKinds.size >= 4 && input.watchlistCount >= 2,
    gateNotes,
  };
};
