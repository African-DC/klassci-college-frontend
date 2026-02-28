---
name: code-review
description: Review frontend Next.js/TypeScript code for bugs, accessibility, performance, and KLASSCI conventions. Use when asked to review code or before creating a PR.
disable-model-invocation: true
---

Perform a thorough code review of the KLASSCI frontend changes.

## Step 1 — Get the changes
```bash
git diff develop...HEAD
git diff --stat develop...HEAD
```

## Step 2 — Review checklist

### Security (CRITICAL — block PR if any found)
- [ ] No `dangerouslySetInnerHTML`
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] No API keys or secrets in code
- [ ] Permissions checked server-side, not only hidden in UI

### TypeScript
- [ ] No `any` types
- [ ] All props properly typed
- [ ] Return types on functions
- [ ] Zod schemas mirror backend Pydantic models

### React / Next.js
- [ ] Server Components used where possible (no unnecessary `"use client"`)
- [ ] No `useEffect` for data fetching (use TanStack Query)
- [ ] No prop drilling > 2 levels (use Zustand/Context)
- [ ] Skeleton loaders present on async components
- [ ] Modal pattern followed for Create/Edit/Show

### Performance
- [ ] No unnecessary re-renders (check useCallback/useMemo if needed)
- [ ] TanStack Query invalidation is targeted (not `queryClient.clear()`)
- [ ] Images use `next/image`
- [ ] No large bundle imports (check for `import * from "lodash"`)

### Accessibility
- [ ] Interactive elements have labels
- [ ] Forms have proper `htmlFor`/`id` pairing
- [ ] Color is not the only differentiator

### Code Quality
- [ ] Components < 150 lines
- [ ] Custom hooks extracted for complex logic
- [ ] Consistent naming (PascalCase components, camelCase functions)

## Step 3 — Report

**🔴 BLOCKING:**
**🟡 IMPORTANT:**
**🟢 SUGGESTIONS:**
**✅ GOOD:**

$ARGUMENTS
