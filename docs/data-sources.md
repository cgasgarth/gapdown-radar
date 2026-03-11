# Data Sources

## Fixture Mode

Fixture mode uses deterministic local company cases and citations. It exists to make tests, smoke checks, and UI work reproducibly.

## Free Live Mode

Free live mode uses:

- `SEC submissions` for recent filing metadata
- `SEC companyfacts` for fundamentals and accounting data
- `SEC filing documents` for filing text snippets
- `Stooq` for daily price history

## Constraints

- no paid feeds are required
- SEC requests require a valid `SEC_USER_AGENT`
- live mode is ticker-universe driven rather than full-market indexed
- transcript/news depth is lighter than a paid institutional stack

## Why This Mix

This gives a free, legally accessible research surface with enough depth to build credible event-driven reports while keeping the project runnable on a local machine.
