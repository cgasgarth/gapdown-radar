# Architecture

## Overview

GapDown Radar is organized as a small Bun monorepo:

- `apps/api` - Hono API, report analysis engine, snapshot persistence, free-live data ingestion
- `apps/web` - local React UI with minimal client-side processing
- `packages/contracts` - shared Zod schemas and TypeScript types for all API payloads
- `scripts` - structure checks and smoke tests
- `e2e` - Playwright browser tests

## Request Flow

1. The web app sends a typed report query to the API.
2. The API validates it with shared contracts.
3. A provider returns `CompanyCase` records from fixture or free-live data.
4. Analysis code converts cases into full report objects.
5. The snapshot store persists the generated report batch locally.
6. The web app renders the current or archived snapshot.

## Data Modes

- `fixture` - deterministic local dataset for repeatable testing
- `freeLive` - SEC filings/companyfacts plus Stooq price history

## Design Principles

- backend owns analysis
- frontend owns presentation
- every boundary is typed and schema-validated
- stale snapshots must fail safely, not break current runs
- no paid vendor dependency in live mode
