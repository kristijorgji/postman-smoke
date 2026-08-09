---
name: project-conventions
description: >
    Reuse-first conventions, source layout, secrets, README/AGENTS upkeep, and
    package-manager notes for this TypeScript Node boilerplate. Use when adding
    features, changing setup behaviour, or structuring new files.
---

# Project conventions

## Reuse before implementing

Before adding modules, utilities, or types, **search this repo first**:

- Core helpers: `src/core/`
- Logging: `src/logger/`
- CLI scripts: `src/scripts/`
- Shared test helpers: `__tests__/`

Extend existing modules rather than duplicating patterns.

## Layout

| Path           | Role                                         |
| -------------- | -------------------------------------------- |
| `src/core/`    | Shared infrastructure (env, path helpers)    |
| `src/logger/`  | Winston logger                               |
| `src/scripts/` | Standalone CLI scripts (Commander + Zod)     |
| `__tests__/`   | Shared test helpers / integration-only tests |
| `.scratch/`    | Local experiments (gitignored)               |

## Style source of truth

Follow ESLint ([`eslint.config.mjs`](../../../eslint.config.mjs)) and Prettier
([`.prettierrc.json`](../../../.prettierrc.json)):

- TypeScript for all new source under `src/`
- Keep import ordering and formatting as enforced by `pnpm lint` / `pnpm fix`

## Package manager

This repo uses **pnpm** (see `packageManager` in `package.json`). Do not introduce
`yarn` or `npm` install workflows.

## README / AGENTS maintenance

Any change to setup steps, env vars, pnpm scripts, or agent workflows must update:

- Root `README.md` when Getting Started, tooling, or dependency notes change
- `AGENTS.md` when agent-facing workflows or skill entry points change

## Secrets and credentials

- Never hardcode secrets, tokens, or private keys in committed files.
- `.env` is gitignored; commit only `.env.example` with non-secret placeholders.
- Prefer reading env via `src/core/loadEnv.ts` rather than scattering `process.env`.
