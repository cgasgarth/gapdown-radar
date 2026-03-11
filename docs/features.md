# Features

## Core Report

Each report includes:

- headline and executive summary
- thesis and historical pattern
- trade recommendation
- risk dashboard
- key signals and risk factors
- catalyst calendar
- peer comparison table
- undropped watchlist
- evidence timeline
- citations with source links when available

## Snapshot Archive

- each generated run is stored locally
- archived runs can be reopened from the UI
- archived detail views use the exact stored report payload

## Seed Ticker Workflow

- users can enter a `seedTicker` in the filter panel
- fixture mode narrows to the seed ticker sector
- free-live mode expands into a mapped peer universe

## Saved Universes And Watchlists

- saved universes are stored locally in SQLite
- each universe can be reused as a report filter
- watchlists and broader universes share the same persistence model
- universe selection can be combined with `seedTicker` for tighter scans

## Trade Recommendation Model

Trade recommendations are research-oriented, not brokerage advice. The current engine derives:

- direction
- conviction
- entry trigger
- stop trigger
- target view
- sizing view

from the same evidence stack that powers the rest of the report.
