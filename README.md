# ts-boilerplate

A fully working TypeScript boilerplate for Node.js projects, scripts, and CLI tools.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Standalone Scripts](#standalone-scripts)
- [Building and Running Compiled Code](#building-and-running-compiled-code)
- [Scratch Code (`.scratch/`)](#scratch-code-scratch)
- [Environmental Variables](#environmental-variables)
- [Scripts](#scripts)
- [Tests](#tests)
- [Git Hooks and Conventional Commits](#git-hooks-and-conventional-commits)
- [CI and Dependency Updates](#ci-and-dependency-updates)
- [Agent guide](#agent-guide)

---

## Tech Stack

- **TypeScript** (ES2022, `NodeNext` module resolution)
- **Vitest** for testing (colocated tests in `src/**/*.test.ts`, global helpers in `__tests__/`)
- **ESLint + Prettier** via
  [@kristijorgji/eslint-config-typescript](https://www.npmjs.com/package/@kristijorgji/eslint-config-typescript)
- **Winston** for structured logging (`src/logger/`)
- **Commander + Zod** for CLI scripts with validated config (`src/scripts/`)
- **dotenv** for environment variable loading
- **Husky + lint-staged** for pre-commit linting and testing
- **Commitlint** enforcing [Conventional Commits](https://www.conventionalcommits.org/)
- **GitHub Actions** CI + **Dependabot** for automated dependency updates
- **Node.js >= 22.16.0** (see `.nvmrc` for the recommended pin)
- **pnpm** (see `packageManager` in `package.json`)

---

## Getting Started

Use this project as a **template** on GitHub or clone it. Requires Node matching
`.nvmrc` and [pnpm](https://pnpm.io/) 9.15.x.

```bash
make dev-init   # pnpm install + husky (via prepare)
pnpm start
```

You will see the example console output. Modify `src/index.ts` and add code as you wish.

Quality aggregators (markdown targets need Docker):

```bash
make fix        # pnpm fix + markdown fix
make lint       # pnpm lint + markdownlint
make verify-hooks
```

---

## Standalone Scripts

Scripts live in `src/scripts/`. Each script follows a structured pattern:

1. **JSDoc block** at the top describing the script's purpose
2. **Zod schema** for validated configuration
3. **Commander CLI** with `--config` (accepts a JSON file path or inline JSON)
4. **`require.main` guard** so the script is both runnable and importable for tests
5. **Exported main function** with the core logic

### Running a script

Use the corresponding `script:*` pnpm script, or run directly with `tsx`:

```bash
# Via pnpm script
pnpm script:example -- --config '{"inputPath":"package.json","summaryOnly":true}'

# Or directly with tsx
pnpm exec tsx -r dotenv/config src/scripts/example.ts \
  --config '{"inputPath":"package.json"}'

# Or with a config file
pnpm script:example -- --config path/to/config.json
```

### Creating a new script

1. Copy `src/scripts/example.ts` as a starting point.
2. Define your Zod config schema and types.
3. Implement your main function (export it for testability).
4. Add a corresponding script in `package.json`:

    ```json
    "script:my-script": "tsx -r dotenv/config src/scripts/my-script.ts"
    ```

---

## Building and Running Compiled Code

You can compile the project to plain JavaScript and run it with `node` directly
(no `tsx` needed at runtime).

```bash
pnpm build    # compiles TypeScript to dist/ and rewrites @src path aliases
pnpm clean    # removes dist/
```

After building, run the main entry or any script with `node`:

```bash
# Main entry
node dist/index.js

# A standalone script
node dist/scripts/example.js --config '{"inputPath":"package.json","summaryOnly":true}'

# Or with a config file
node dist/scripts/example.js --config path/to/config.json
```

The build step uses `tsc` followed by
[`tsc-alias`](https://www.npmjs.com/package/tsc-alias), which rewrites `@src/*`
path aliases to relative paths so the compiled output works with plain Node.js
without any additional loaders.

---

## Scratch Code (`.scratch/`)

The `.scratch` folder is a local workspace for prototyping, experimenting, and
testing ideas. It's intentionally **excluded from version control** via
`.gitignore`, so you can freely write temporary scripts without affecting the
repository.

- Use it for quick experiments (e.g., queries, utility tests, isolated logic).
- You can import code from the main `src/` directory.
- TypeScript is configured to support this folder (see
  [tsconfig.scratch.json](tsconfig.scratch.json)).

> Note: Since `.scratch/` is not committed, avoid placing any important or
> long-term code here.

---

## Environmental Variables

The project uses `dotenv`. Create a `.env` file in the project root and your
variables will be loaded automatically by the main entry point and by scripts
that use `loadEnv`.

See `.env.example` for reference.

---

## Scripts

Run with `pnpm <command>`.

| Command        | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| test           | Run Vitest in watch mode                                                  |
| test:run       | Run Vitest once (e.g. for CI)                                             |
| start          | Start the app with tsx (works in IntelliJ debug mode)                     |
| build          | Compile TypeScript to `dist/` and rewrite `@src` aliases                  |
| clean          | Remove `dist/`                                                            |
| typecheck      | Run `tsc --noEmit`                                                        |
| lint           | Lint the project (ESLint)                                                 |
| fix            | Auto-fix lint issues                                                      |
| script:example | Run the example CLI script (see `src/scripts/example.ts`; use `--config`) |
| prepare        | Install Husky hooks and sync vendor agent skills                          |

Make targets: `make lint` / `make fix` also run Docker markdown lint/fix;
`make test` runs `pnpm test`.

---

## Tests

- **Colocated tests:** Put unit tests next to source files, e.g. `src/core/foo.ts`
  and `src/core/foo.test.ts`.
- **Global helpers:** Use `__tests__/` for shared setup, fixtures, and
  integration tests only.
- **Coverage:** Enforced at 90% (statements, branches, functions, lines) via
  `vitest.config.ts`.
- **Timezone:** The test environment uses UTC (`vitest.setup.ts`) so time-based
  operations are reproducible.

---

## Git Hooks and Conventional Commits

This project uses [Husky](https://typicode.github.io/husky/) to manage git hooks
and [Commitlint](https://commitlint.js.org/) to enforce
[Conventional Commits](https://www.conventionalcommits.org/).

### Pre-commit hook

Runs automatically before every commit:

1. **lint-staged** — `eslint --fix` on staged JS/TS; `prettier --write` on staged
   JSON/Markdown
2. **vitest run** — runs the full test suite (`pnpm test:run`)

If either step fails, the commit is aborted.

### Commit message hook

Every commit message is validated against the
[Conventional Commits](https://www.conventionalcommits.org/) specification.
Valid prefixes include:

`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
`ci`, `revert`

Examples:

```text
feat: add user authentication
fix: resolve null pointer in loadEnv
chore: upgrade vitest to v4
docs: update README with hooks section
```

### Setup

Hooks are installed automatically via the `prepare` script when you run
`pnpm install` / `make dev-init`. Verify with:

```bash
make verify-hooks
```

---

## CI and Dependency Updates

- **CI** (`.github/workflows/ci.yml`): On push and PRs to `main`, runs typecheck,
  lint, markdownlint (`make lint-markdown`), and tests. Node version is read from
  `.nvmrc`.
- **Dependabot** (`.github/dependabot.yml`): Daily PRs for npm and GitHub Actions
  updates (`typescript` is ungrouped).
- **Auto-merge:** Dependabot PRs enable GitHub auto-merge (squash) when opened;
  they merge after required CI passes. Enable **Allow auto-merge** in repo
  Settings → General → Pull Requests.

---

## Agent guide

See [AGENTS.md](AGENTS.md) and [`.agents/skills/`](.agents/skills/).
