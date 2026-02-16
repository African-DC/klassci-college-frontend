---
name: commit
description: Create a conventional commit for the frontend. Use when the user asks to commit changes.
disable-model-invocation: true
allowed-tools: Bash(git *)
---

Create a conventional commit for the KLASSCI frontend following these steps:

1. Run `git status` to see all changed files
2. Run `git diff --staged` and `git diff` to review changes
3. Run `git log --oneline -5` to check recent commit style

4. Analyze and determine:
   - **type**: feat | fix | refactor | test | docs | chore | style
   - **scope**: auth | enrollments | fees | timetable | grades | attendance | notifications | dashboard | settings | ui | i18n
   - **description**: imperative English, ≤ 72 chars

5. Stage only relevant files explicitly (NEVER `git add -A` or `git add .`)
   - Never stage: `.env.local`, `.env*`, `node_modules/`, `.next/`

6. Create the commit using heredoc format

**Rules:**
- NO "Generated with Claude Code" or "Co-Authored-By"
- NO WIP commits on develop/main
- Split unrelated changes into separate commits

$ARGUMENTS
