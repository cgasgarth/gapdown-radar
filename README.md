# GapDown Radar

GapDown Radar is a local-first short-bias research desk for one-day stock breaks. It scans two years of drawdowns, explains the likely cause, ranks undropped peers with similar stress, and now adds trade views, risk dashboards, catalyst calendars, peer comparisons, and evidence timelines.

## Quick Rundown

- `API-first`: all analysis runs in the Bun + Hono backend; the frontend mostly fetches and renders
- `Strict TS`: shared Zod contracts, hard compile-time rules, no extension imports, unused import failures, 400-line max, and folder-count warnings
- `Free live mode`: uses SEC EDGAR/companyfacts + Stooq, no paid market data required
- `Local archive`: every report run is snapshotted and can be reopened from the website
- `SQLite universes`: saved watchlists and custom universes persist locally in SQLite
- `Research output`: explanation, trade recommendation, risk dashboard, catalysts, peer table, watchlist, citations, and timeline

## Start

```bash
bun install
bun run dev
```

- API: `http://localhost:4001`
- Web: `http://localhost:5173`

## Live Free Mode

```bash
export DATA_PROVIDER=free-live
export FREE_LIVE_TICKERS=EMAT,PLUG,RUN,ARRY,SEDG,ENPH
export SEC_USER_AGENT="your-email@example.com gapdown-radar research"
bun run dev
```

Notes:

- `SEC_USER_AGENT` is required because the SEC blocks anonymous/default clients
- `FREE_LIVE_TICKERS` defines the base universe; `seedTicker` narrows/expands from peer mappings in the app
- fixture mode stays the default so tests remain deterministic

## Verification

```bash
bun run verify
```

That runs:

- structure checks
- ESLint
- Prettier check
- TypeScript typecheck
- Bun unit tests
- production builds
- smoke tests
- Playwright end-to-end tests

## Docs

- `docs/architecture.md`
- `docs/features.md`
- `docs/data-sources.md`
- `docs/testing.md`

## Optional Codex Writer Mode

```bash
export REPORT_WRITER_MODE=codex-app-server
export CODEX_MODEL=gpt-5.4
```

The default writer stays deterministic so local verification works without credentials.
