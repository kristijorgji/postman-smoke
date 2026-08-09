# @kristijorgji/postman-smoke

Reusable TypeScript runner for Postman collections: ordered HTTP smoke with
OK / EXPECTED_4XX / WARN / FAIL / SKIP reporting and a plugin API for
project-specific fixtures, captures, and classification rules.

Bootstrapped from the
[ts-boilerplate](https://github.com/kristijorgji/ts-boilerplate) template.

## Install

```bash
pnpm add @kristijorgji/postman-smoke
# or while developing locally:
pnpm add @kristijorgji/postman-smoke@link:../path/to/postman-smoke
```

Requires Node matching `.nvmrc` and pnpm 9.15.x.

```bash
make dev-init
pnpm test:run
```

## Quick start

`smoke.config.ts`:

```ts
import { defineConfig } from '@kristijorgji/postman-smoke';

export default defineConfig({
    collectionPath: './collection.json',
    orderPath: './order.json',
    apiOrigin: 'http://127.0.0.1',
    hostHeader: 'api.localhost',
    // Optional: project-specific 429 / 5xx handling
    classifyRules: {
        expected429: (_name, url) => /\/throttle-probe/.test(url),
        warn5xx: (_name, _url, _status, snippet) => /upstream unavailable/i.test(snippet),
    },
    skipUrl: url => /oauth\.example\.com/.test(url),
});
```

```bash
pnpm exec postman-smoke --config ./smoke.config.ts
pnpm exec postman-smoke --config ./smoke.config.ts --strict
```

Or call `runSmoke(resolveConfig(config, strict))` from a small `tsx` entry.

## Config highlights

| Field                           | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `collectionPath` / `orderPath`  | Postman JSON + ordered request keys              |
| `apiOrigin` / `hostHeader`      | Base origin and `Host` header                    |
| `initialVars` / `lockedVarKeys` | `{{var}}` substitution                           |
| `plugins`                       | Lifecycle hooks (`beforeAll`, `afterRequest`, …) |
| `classifyRules`                 | Override 429 / 4xx / 5xx handling                |
| `skipUrl`                       | Skip third-party / non-API URLs                  |
| `leftoverScore`                 | Order for requests missing from `order.json`     |
| `resolveAuthorization`          | Custom `Authorization` header resolution         |
| `extraResults`                  | Append synthetic probes to the report            |
| `reportHtmlPath`                | Optional path for a self-contained HTML report   |

CLI also accepts `--report-html <path>` (overrides config). Console output always
includes the full request URL next to each result row.

Core classification has **no** product-specific path heuristics. Put admin/CMS/sitemap
(or any other) rules in `classifyRules` or a plugin `classify` hook.

## Quality

```bash
pnpm fix
pnpm lint
pnpm test:run
pnpm typecheck
```

## Agent guide

See [AGENTS.md](AGENTS.md) and [`.agents/skills/`](.agents/skills/).
