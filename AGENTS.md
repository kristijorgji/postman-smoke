# Agent guide

Reusable Postman smoke runner (`@kristijorgji/postman-smoke`), bootstrapped from
ts-boilerplate (Vitest, ESLint, pnpm).

## Read first

| Resource                             | Purpose                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- |
| [README.md](README.md)               | Setup, scripts, troubleshooting                                             |
| [`.agents/skills/`](.agents/skills/) | Task skills (conventions, TypeScript, linting, verification, commits, docs) |
| [`Makefile`](Makefile)               | `make lint`, `make fix`, `make test`, markdown via Docker, `verify-hooks`   |
| [`package.json`](package.json)       | Scripts: `lint`, `fix`, `test`, `test:run`, `typecheck`, `build`            |

`.agents/skills/vendor/` is generated at `pnpm install` from `@kristijorgji/*/skills`
(see `scripts/sync-agent-skills.mjs`). Do not edit those files by hand.

Cursor rules under [`.cursor/rules/`](.cursor/rules/) are lean wrappers that
**import** those skills. Agent hard-ignore SSoT is [`.aiignore`](.aiignore);
[`.cursorignore`](.cursorignore), [`.codeiumignore`](.codeiumignore),
[`.aiexclude`](.aiexclude), [`.clineignore`](.clineignore), and
[`.geminiignore`](.geminiignore) are symlinks to it.

## Stack

- Node `>=22.16` (see `.nvmrc` for the recommended pin), **pnpm**, TypeScript
- Vitest; ESLint via `@kristijorgji/eslint-config-typescript`
- Winston logging; Commander + Zod for CLI scripts

## Layout

| Path              | Role                          |
| ----------------- | ----------------------------- |
| `src/collection/` | Flatten / order / classify    |
| `src/runner.ts`   | Ordered HTTP suite + plugins  |
| `src/cli.ts`      | `postman-smoke` CLI           |
| `src/config.ts`   | `defineConfig` / plugin types |
| `src/http/`       | Thin fetch wrapper            |
| `src/logger/`     | Winston logger                |
| `bin/`            | CLI shim                      |
| `__tests__/`      | Shared test helpers           |

## Quality before finishing work

```shell
make fix
make lint
pnpm typecheck
pnpm test:run
pnpm build
```

Or via Make aggregators (includes Docker markdown): `make fix` / `make lint` / `make test`.

See [.agents/skills/verification/SKILL.md](.agents/skills/verification/SKILL.md).

## Commits

Conventional Commits — [.agents/skills/commit-message/SKILL.md](.agents/skills/commit-message/SKILL.md).
