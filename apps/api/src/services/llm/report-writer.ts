import type { DraftNarrative } from "../analysis/report-analysis";

import { requestCodexNarrative } from "./codex-app-server";

type WriterMode = "deterministic" | "codex-app-server";

type WriterInput = {
  readonly mode: WriterMode;
  readonly model: string;
  readonly ticker: string;
  readonly companyName: string;
  readonly primaryCause: string;
  readonly riskFactors: readonly string[];
  readonly historicalPattern: string;
  readonly watchlistTickers: readonly string[];
  readonly fallback: DraftNarrative;
};

const buildPrompt = (input: WriterInput): string => {
  return [
    "Write an institutional-quality short report summary.",
    `Ticker: ${input.ticker}`,
    `Company: ${input.companyName}`,
    `Primary cause: ${input.primaryCause}`,
    `Risk factors: ${input.riskFactors.join("; ")}`,
    `Historical pattern: ${input.historicalPattern}`,
    `Watchlist peers: ${input.watchlistTickers.join(", ")}`,
    "Avoid retail phrasing, hype, and trading slang.",
  ].join("\n");
};

export const writeNarrative = async (input: WriterInput): Promise<DraftNarrative> => {
  if (input.mode === "deterministic") {
    return input.fallback;
  }

  try {
    return await requestCodexNarrative({
      model: input.model,
      prompt: buildPrompt(input),
    });
  } catch {
    return input.fallback;
  }
};
