import { z } from "zod";

const EnvironmentSchema = z
  .object({
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4001),
    DATA_PROVIDER: z.enum(["fixture", "free-live"]).default("fixture"),
    FREE_LIVE_TICKERS: z.string().optional(),
    SEC_USER_AGENT: z.string().min(1).optional(),
    REPORT_WRITER_MODE: z.enum(["deterministic", "codex-app-server"]).default("deterministic"),
    CODEX_MODEL: z.string().min(1).default("gpt-5.4"),
  })
  .superRefine((value, context) => {
    if (value.DATA_PROVIDER === "free-live" && value.FREE_LIVE_TICKERS === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["FREE_LIVE_TICKERS"],
        message: "FREE_LIVE_TICKERS is required when DATA_PROVIDER=free-live.",
      });
    }

    if (value.DATA_PROVIDER === "free-live" && value.SEC_USER_AGENT === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SEC_USER_AGENT"],
        message: "SEC_USER_AGENT is required when DATA_PROVIDER=free-live.",
      });
    }
  });

export type ApiEnvironment = z.infer<typeof EnvironmentSchema>;

export const parseTickerList = (value: string): ReadonlyArray<string> => {
  return value
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => ticker.length > 0);
};

export const loadEnvironment = (): ApiEnvironment => {
  return EnvironmentSchema.parse(process.env);
};
