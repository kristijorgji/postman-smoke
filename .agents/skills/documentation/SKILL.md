---
name: documentation
description: >
    Where to document setup and agent workflows in this boilerplate. Use when
    editing README, AGENTS.md, or docs.
---

# Documentation scope

## Core principles

| Rule                      | Rationale                                                      |
| ------------------------- | -------------------------------------------------------------- |
| **Document what you own** | This repo is a TypeScript Node / CLI boilerplate               |
| **One Getting Started**   | Root `README.md` covers setup, scripts, and troubleshooting    |
| **Agent entry**           | `AGENTS.md` points at skills and quality commands — keep short |

## Where to put what

| Content                                 | Location                            |
| --------------------------------------- | ----------------------------------- |
| Local setup / scripts / troubleshooting | Root `README.md`                    |
| Agent workflows / skills                | `AGENTS.md` + `.agents/skills/`     |
| Commit message workflow                 | `.agents/skills/commit-message/`    |
| Env variable meanings                   | Comments in `.env.example` + README |

When setup behaviour changes, update README (and AGENTS if agent workflows changed)
in the same change set.
