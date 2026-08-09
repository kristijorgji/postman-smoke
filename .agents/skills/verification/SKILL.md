---
name: verification
description: >
    Use after completing all planned code changes to verify nothing is broken.
    Runs type checking, linting, markdown lint, tests, and builds.
    Must be the final step of every task -- do not skip any command.
---

# Verification

After all planned changes are complete, run the following commands **in order**.
Fix any issues before considering the task done.

## 1. Lint and auto-fix

```bash
make fix
make lint
```

`make fix` runs `pnpm fix` plus Docker markdown fix. `make lint` runs `pnpm lint`
plus Docker markdownlint. All must exit cleanly. Markdown targets require Docker.

## 2. Type check

```bash
pnpm typecheck
```

Must pass with zero errors.

## 3. Run tests

```bash
pnpm test:run
```

All tests must pass. Prefer `test:run` (once) over watch mode for verification.

## 4. Production build

```bash
pnpm build
```

Must complete without errors. Output lands in `./dist`.
