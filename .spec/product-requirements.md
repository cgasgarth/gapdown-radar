# Product Requirements

## Goal

Build a local research website that identifies companies with one-day drawdowns of at least 10%, explains the likely underlying causes, and surfaces undropped peers showing materially similar stress factors.

## Scope

- Run entirely on the local machine.
- Use a Bun API layer as the single source of computation.
- Keep the frontend focused on report retrieval and presentation.
- Support historical analysis across the last two years.
- Use free data sources for filings, fundamentals, and price history.
- Use filings, earnings commentary, financial data, market action, and news-like public disclosures as evidence classes.
- Produce concise but institutional-quality short reports.

## Functional Requirements

1. The system must accept a start date, end date, minimum drop threshold, and report cap.
2. The API must validate that the requested time window does not exceed two years.
3. The report engine must explain each drawdown with ranked causal buckets.
4. The report engine must derive evidence from at least four source classes.
5. The report engine must identify comparable undropped companies with overlapping stress signals.
6. The website must display a report list and a detail view.
7. Every report must expose citations and a quality score.
8. The local project must be testable without external services.
9. The live mode must work without paid APIs by using SEC and free price-history sources.

## Non-Goals

- Retail-style momentum commentary
- trade execution
- brokerage integration
- optimistic defaults that hide missing inputs or missing evidence
- dependency on paid market-data vendors

## Delivery Standard

- Tight summaries, direct language, no meme phrasing
- Strong compile-time guarantees
- Folder organization pressure via structure warnings
- Hard file-length limit of 400 lines
