---
name: create-pr
description: Create a pull request for the frontend. Use when the user asks to create a PR.
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh *)
---

Create a pull request for the KLASSCI frontend targeting `develop`.

## Step 1 — Verify
```bash
git status
git log develop..HEAD --oneline
git diff develop...HEAD --stat
```

## Step 2 — Push
```bash
git push -u origin HEAD
```

## Step 3 — Create PR

```bash
gh pr create \
  --base develop \
  --title "<type>(<scope>): <description>" \
  --body "$(cat <<'EOF'
## Summary
- [What this PR does]

## Changes
- `Component.tsx` — [what changed]

## Type of change
- [ ] feat | fix | refactor | test | chore | style

## Screenshots
<!-- Add before/after screenshots for UI changes -->

## Testing
- [ ] Tested locally `npm run dev`
- [ ] No TypeScript errors `npx tsc --noEmit`
- [ ] ESLint passes `npm run lint`
- [ ] Responsive on mobile (375px)
- [ ] Modal pattern followed for Create/Edit
- [ ] Skeleton loaders in place

## API changes
- [ ] No API changes needed
- [ ] Zod schemas updated to match backend changes

## Checklist
- [ ] No `any` TypeScript types
- [ ] No `dangerouslySetInnerHTML`
- [ ] No sensitive data in localStorage
- [ ] TanStack Query invalidation is targeted
EOF
)"
```

$ARGUMENTS
