# Testing

## Commands

```bash
bun run test
bun run smoke
bun run check:e2e
bun run verify
```

## Test Layers

- `bun test` - API contract and behavior tests
- `smoke` - local end-to-end API/report quality gate using the fixture engine
- `check:e2e` - Playwright test of the local website flow
- `verify` - full repository quality gate

## E2E Coverage

The Playwright flow currently verifies:

- page boot and hero render
- report list availability
- seed ticker input workflow
- detail page rendering
- trade recommendation section
- risk dashboard section
- catalyst section
- peer comparison section
- timeline section
- citation link presence

## Notes

- Playwright installs Chromium automatically in `check:e2e`
- fixture mode is used for deterministic local browser coverage
- free-live mode should still be spot-checked manually because external data can drift
