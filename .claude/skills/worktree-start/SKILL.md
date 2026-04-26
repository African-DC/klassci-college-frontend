---
name: worktree-start
description: Start work on a GitHub issue using a git worktree. Use when starting a new feature or fix from an issue number.
---

# Démarrage worktree — KLASSCI Frontend

## Workflow : Issue → Worktree → Branch → PR

Suis ces étapes pour démarrer le travail sur une issue GitHub.

### Étape 1 — Récupérer les infos de l'issue

```bash
gh issue view $ISSUE_NUMBER --repo African-DC/klassci-college-frontend
```

Extraire :
- Le **titre** de l'issue pour nommer la branche
- Le **type** : feat / fix / refactor / test / chore

### Étape 2 — Mettre à jour develop en local

```bash
git fetch origin
git checkout develop
git pull origin develop
```

### Étape 3 — Créer le worktree

Format du dossier : `../worktree-front-<issue>-<slug>`
Format de la branche : `<type>/<issue>-<slug-du-titre>`

Exemple pour l'issue #2 "feat(auth): NextAuth.js v5" :
- Dossier : `../worktree-front-2-nextauth`
- Branche : `feature/2-nextauth-v5`

```bash
git worktree add ../worktree-front-<issue>-<slug> -b <type>/<issue>-<slug> origin/develop
```

### Étape 4 — Confirmer à l'utilisateur

Afficher :
```
✅ Worktree créé :
   Dossier : ../worktree-front-<issue>-<slug>
   Branche : <type>/<issue>-<slug>
   Base    : origin/develop

Ouvre ce dossier dans ton éditeur ou navigue avec :
  cd ../worktree-front-<issue>-<slug>
```

### Étape 5 — Proposer le serveur de développement

Après création du worktree, proposer :

> Veux-tu que je lance le serveur de développement dans le worktree ?
> ```bash
> cd ../worktree-front-<issue>-<slug>
> npm install   # si node_modules absent
> npm run dev   # démarre sur http://localhost:3000
> ```
> Ou tu le lances toi-même ?

Attendre que l'utilisateur valide visuellement dans le navigateur avant de passer à la PR.

### Règles importantes

- **Jamais travailler directement sur `develop` ou `main`**
- Le worktree est un dossier séparé — chaque dev peut en avoir plusieurs en parallèle
- Toujours partir de `origin/develop` (pas du local)
- Branche naming : `feature/N-desc`, `fix/N-desc`, `hotfix/N-desc`, `chore/desc`
- Dans le worktree, lancer `npm install` si `node_modules` absent
- Une fois le travail terminé dans le worktree, invoquer `/worktree-finish`

$ARGUMENTS
