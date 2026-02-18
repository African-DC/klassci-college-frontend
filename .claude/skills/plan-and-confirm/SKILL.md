---
name: plan-and-confirm
description: Explore the codebase, present a clear implementation plan, and wait for explicit user approval before writing any code. Use for any non-trivial change (new feature, bug fix, refactor). Rule #1 — never code without OKAY.
allowed-tools: Read, Glob, Grep, Bash(git *)
---

# Plan & Confirm — KLASSCI Frontend

## Phase 1 — Explore (read only, no modifications)

Before writing any plan, explore the relevant files:

1. Read all files directly related to the task (pages, components, hooks, stores, validators, API clients, tests)
2. Search for usages of the affected symbols: `Grep` for component names, hook names, API function names
3. Identify Zod schema constraints, TanStack Query keys, Zustand store slices, and Next.js layout boundaries
4. Check whether the change affects a Server Component or a Client Component (`"use client"` directive)
5. Check if a corresponding backend endpoint exists or needs to be created first

**Rule: zero file modifications in this phase.**

---

## Phase 2 — Present the plan

Structure your response exactly as follows:

### Ce que j'ai compris
- Describe the request with precise file:line references
- Flag any ambiguous or non-obvious points
- List all possible interpretations if more than one exists

### Ce que je vais faire
- List every file to modify or create, with the reasoning for each change
- State explicitly what will NOT be changed and why
- Specify: Server Component vs Client Component for each new file
- Specify: new Zod schema / new query key / new store slice if needed

### Points d'attention
- Any component that could break elsewhere (shared layout, shared store)
- Any assumption made (and why)
- Any API contract dependency on the backend

---

## Phase 3 — Wait for approval

**⛔ STOP. Do not touch any file.**

Output literally:

> Merci de confirmer avec **OKAY** si la compréhension et le plan sont corrects.
> Sinon, dites-moi ce qui est inexact et je vais ajuster avant de coder.

**Absolute rule:** If the user does not say OKAY (or equivalent: "oui", "c'est bon", "go", "lance"), stay in Phase 3. Do not proceed.

---

## Phase 4 — Implement (only after OKAY)

Once OKAY is received:

1. Implement exactly as described in the approved plan — no additions, no improvements beyond scope
2. If something discovered during implementation changes the plan → **stop and re-present** before continuing
3. After implementation, verify:
   ```bash
   npm run type-check
   npm run lint
   npm test
   ```
4. Summarize changes with file:line references

**Never commit** unless the user explicitly asks.

---

## Rules

- **Never code without OKAY** — this is rule #1
- Base all analysis on files actually read — no guessing
- If the plan is rejected, re-explore if needed then present a revised plan
- A "trivial change" (typo, single string edit) does not require this workflow

$ARGUMENTS
