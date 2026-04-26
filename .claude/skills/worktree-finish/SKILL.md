---
name: worktree-finish
description: Finish work on a worktree — push branch, create PR to develop, clean up. Use when the feature/fix is complete.
---

# Clôture worktree — KLASSCI Frontend

## Workflow : Push → PR → Cleanup

Suis ces étapes pour finaliser le travail dans un worktree.

### Étape 1 — Vérifier l'état

```bash
git status
git diff --staged
git log --oneline origin/develop..HEAD
```

S'assurer qu'il n'y a pas de changements non commités.

### Étape 2 — Pousser la branche

```bash
git push -u origin <branch-name>
```

### Étape 3 — Créer la PR vers develop

```bash
gh pr create \
  --repo African-DC/klassci-college-frontend \
  --base develop \
  --head <branch-name> \
  --title "<type>(<scope>): <description courte>" \
  --body "$(cat <<'EOF'
## Description

<!-- Ce que fait ce PR -->

## Closes

Closes #<issue-number>

## Checklist

- [ ] Tests passent (`npm test`)
- [ ] Linting passe (`npm run lint`)
- [ ] Type-check OK (`npm run type-check`)
- [ ] Build OK (`npm run build`)
- [ ] Branche à jour avec develop
EOF
)"
```

### Étape 4 — Afficher le lien de la PR

```bash
gh pr view --web
```

### Étape 5 — Confirmer à l'utilisateur

```
✅ PR créée : <URL>
   Base    : develop
   Branch  : <branch-name>
   Issue   : #<issue-number>

⏳ En attente de review.
```

### Étape 6 — Nettoyage + fermeture d'issue (après merge uniquement)

⚠️ **Ne supprimer le worktree QU'APRÈS que la PR soit mergée sur develop.**

Une fois la PR mergée, exécuter dans cet ordre :

**1. Nettoyer le worktree :**
```bash
# Depuis klassci-frontend/ (pas depuis le worktree)
git worktree remove ../worktree-front-<issue>-<slug>
git worktree prune
```

**2. Fermer l'issue liée manuellement :**

> ⚠️ Les PRs mergées dans `develop` ne ferment PAS les issues automatiquement.
> `Closes #N` ne déclenche la fermeture qu'au merge dans la branche par défaut (`main`).
> Fermeture manuelle obligatoire après chaque merge dans `develop`.

```bash
gh issue close <issue-number> \
  --repo African-DC/klassci-college-frontend \
  --comment "Implémenté et mergé dans \`develop\` via PR #<pr-number>. Sera disponible en production au prochain merge develop → staging → main."
```

Confirmer à l'utilisateur :
```
✅ Worktree supprimé
✅ Issue #<N> fermée
```

### Règles importantes

- **La PR va vers `develop`, jamais directement vers `main`**
- Le titre du PR doit suivre : `type(scope): description`
- `Closes #N` est conservé dans le body PR (traçabilité) mais la fermeture manuelle est obligatoire après merge dans `develop`
- Ne pas squash les commits (merge commit pour conserver l'historique)
- Toujours nettoyer le worktree **depuis le repo principal**, jamais depuis l'intérieur du worktree

$ARGUMENTS
