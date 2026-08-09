---
name: typescript-best-practices
description: >
    Use when writing, reviewing, or refactoring TypeScript code in this project.
    Covers type safety, code reuse, modularity, import conventions, and formatting.
---

# TypeScript Best Practices

## No `any`

Never use `any`. If the type is truly unknown, use `unknown` and narrow it with
type guards. For callback parameters you don't need, use `_` prefixed names with
their actual type.

```typescript
// Bad
function parse(data: any) { ... }

// Good
function parse(data: unknown): ParsedResult {
  if (typeof data === 'string') { ... }
}
```

## Type Everything

All function parameters, return values, and API/config shapes must have explicit
types. Prefer Zod-inferred types for validated config (`z.infer<typeof schema>`).

- Shared helpers: `src/core/`
- Logger: `src/logger/`
- Scripts: `src/scripts/`

## Reuse Before Creating

Before creating new types or helpers, check whether existing code can be reused
or extended under `src/core/`, `src/logger/`, and `src/scripts/`.

## Explicit Return Types on Exports

Every exported function must declare its return type explicitly.

```typescript
// Good
export function findRootDir(startDir: string): string { ... }

// Bad — inferred return type
export function findRootDir(startDir: string) { ... }
```

## Object / array locals and `satisfies`

Const-bound object and array values must use an **explicit type annotation on
the binding** when ESLint enforces it. In tests, use `satisfies SomeNamedType`
on **inline** mock / expect bodies — not weak `satisfies any|unknown|object`.

## Use `type` Imports

Prefer `import type` for type-only imports so they are erased at compile time.

```typescript
import type { ExampleConfig } from '@src/scripts/example';
```

## Path Aliases

| Alias    | Target  |
| -------- | ------- |
| `@src/*` | `src/*` |

```typescript
// Good
import { logger } from '@src/logger';

// Bad
import { logger } from '../../logger';
```

## Formatting and Linting

- **Single quotes**, **semicolons**, **trailing commas** (`all`).
- **4-space indentation**, **120-character print width**.
- Run `pnpm lint` and `pnpm fix` (or `make lint` / `make fix`) before committing.
