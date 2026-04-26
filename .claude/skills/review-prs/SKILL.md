---
name: review-prs
description: Review all open pull requests on the klassci-college-frontend GitHub repo. Reads each PR's changed files, checks against project rules (Bearer token, Sonner toast, RSC boundaries, no hardcoded data, optimistic updates, open redirect, no memory leaks), then submits formal gh pr review --request-changes or --approve for each PR. Also dismisses any prior approval that should no longer stand. Use when asked to review PRs or audit open PRs.
disable-model-invocation: true
---

# Review PRs — KLASSCI Frontend

Review all open PRs on `African-DC/klassci-college-frontend` and submit formal GitHub reviews.

## Step 1 — List open PRs

```bash
gh pr list --repo African-DC/klassci-college-frontend --state open --json number,title,headRefName,author
```

## Step 2 — For each PR, fetch changed files and read key ones

```bash
gh pr view <N> --repo African-DC/klassci-college-frontend --json files,title,headRefName
```

Read the most critical files per PR category:
- Auth PRs: `auth.ts`, `middleware.ts`, `components/forms/LoginForm.tsx`, `lib/api/*.ts`
- Feature PRs: `lib/api/<feature>.ts`, `lib/hooks/use<Feature>.ts`, `components/**/<Feature>*.tsx`
- Portal/layout PRs: `app/**/layout.tsx`, `components/shared/*Nav.tsx`, portal page files

## Step 3 — Check each PR against the KLASSCI checklist

### CRITIQUE (REQUEST CHANGES obligatoire si un seul est présent)

1. **Pas de Bearer token** — `lib/api/*.ts` doit inclure `Authorization: Bearer ${session?.accessToken}`
2. **Open Redirect** — `callbackUrl` ou tout paramètre URL utilisé dans `router.push()` sans validation `/` prefix check
3. **Radix Toast au lieu de Sonner** — présence de `hooks/use-toast.ts`, `components/ui/toast.tsx`, `useToast()` → remplacer par `import { toast } from 'sonner'`
4. **Données hardcodées** en production — noms fictifs, KPIs fixes, notes factices dans des composants non-mock
5. **`"use client"` injustifié** sur layouts ou pages qui n'utilisent pas de hooks browser/state
6. **Pas d'optimistic updates** — mutations TanStack Query sans `onMutate`/`onError`/`onSettled`
7. **Memory leak** — `setInterval`/`setTimeout` dans `useEffect` sans cleanup `return () => clearInterval(...)`

### IMPORTANT (noter mais pas forcément bloquer)

8. **Logout manquant** dans les navs mobiles (portails teacher/student/parent)
9. **Role types** — vérifier que les valeurs sont exactement `"admin" | "teacher" | "student" | "parent"` (lowercase)
10. **Params `searchParams`/`params` non-awaitées** dans App Router Next.js 15
11. **`queryClient.clear()` ou `invalidateQueries` trop larges**

## Step 4 — Vérifier les reviews existantes

```bash
gh api repos/African-DC/klassci-college-frontend/pulls/<N>/reviews | node -e "
let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{
  const data=JSON.parse(d);
  data.forEach(r=>console.log('id='+r.id+' state='+r.state+' user='+r.user.login));
});
"
```

Si une review `APPROVED` existe et que le PR a des problèmes CRITIQUE → **dismiss l'approval** :

```bash
gh api repos/African-DC/klassci-college-frontend/pulls/<N>/reviews/<review_id>/dismissals \
  --method PUT \
  --field message="Dismissing previous approval — <raison courte>. See REQUEST CHANGES review for full details."
```

## Step 5 — Soumettre la review formelle

### REQUEST CHANGES
```bash
gh pr review <N> --repo African-DC/klassci-college-frontend --request-changes --body "$(cat <<'EOF'
## REQUEST CHANGES — <titre PR>

### CRITIQUE

**1. <problème>** (`fichier:ligne`)
<explication + code correct>

**2. ...**

### IMPORTANT

**...**

### Résumé des blocages

| # | Sévérité | Problème |
|---|----------|---------|
| 1 | CRITIQUE | ... |
EOF
)"
```

### APPROVE (seulement si ZERO problème CRITIQUE)
```bash
gh pr review <N> --repo African-DC/klassci-college-frontend --approve --body "LGTM — tous les critères projet sont respectés."
```

## Step 6 — Résumé final

Afficher un tableau récapitulatif :

| PR | Titre | Décision | Nb problèmes critiques |
|----|-------|----------|------------------------|
| #N | ...   | REQUEST CHANGES / APPROVE | N |

$ARGUMENTS
