# Engineering Standards

## Type Safety

- Enable strict TypeScript and related narrowing flags.
- Validate external and cross-layer payloads with Zod.
- Prefer explicit return types for exported functions.
- Avoid implicit fallbacks that hide missing configuration or missing data.

## API-First Design

- All research and scoring lives in the API layer.
- The frontend may fetch, select, and render, but not interpret financial evidence.
- Shared contracts package defines request and response schemas.

## Repository Rules

- Maximum 400 lines for code and style files.
- Warn when any folder contains more than 6 direct files.
- Named exports only.
- No unused imports or unused variables.
- Import paths omit file extensions.

## Quality Gates

- `bun run check:structure`
- `bun run lint`
- `bun run format:check`
- `bun run typecheck`
- `bun run test`
- `bun run build`
- `bun run smoke`
