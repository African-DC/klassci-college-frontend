---
name: plan-and-confirm
description: Explore the codebase, present a clear implementation plan, and wait for explicit user approval before writing any code. Use for any non-trivial change (new feature, bug fix, refactor). Rule #1 — never code without OKAY.
---

# Plan & Confirm — KLASSCI Frontend

## Phase 1 — Explorer (lecture seule, zéro modification)

Avant d'écrire quoi que ce soit, explorer les fichiers concernés :

1. Lire tous les fichiers liés à la tâche (pages, composants, hooks, actions serveur, types, schémas Zod)
2. Chercher les usages des symboles affectés : `Grep` sur noms de composants, hooks, fonctions API
3. Identifier : directives `"use client"`, contraintes Zod, dépendances backend (endpoint existant ?)
4. Vérifier si des tests existent pour les fichiers impactés

**Règle : zéro modification de fichier dans cette phase.**

---

## Phase 2 — Présenter le plan

Structurer la réponse exactement ainsi :

### Ce que j'ai compris
- Décrire la demande avec des références précises `fichier:ligne`
- Signaler tout point ambigu ou non évident
- Lister toutes les interprétations possibles s'il y en a plusieurs

### Ce que je vais faire
- Lister chaque fichier à modifier ou créer, avec la justification
- Préciser : Server Component vs Client Component pour chaque nouveau fichier
- Indiquer explicitement ce qui NE sera PAS modifié et pourquoi

### Points d'attention
- Tout composant qui pourrait casser ailleurs (layout partagé, store)
- Toute hypothèse faite (et pourquoi)
- Toute dépendance sur un endpoint backend

---

## Phase 3 — Attendre l'approbation

**⛔ STOP. Ne toucher à aucun fichier.**

Afficher littéralement :

> Merci de confirmer avec **OKAY** si la compréhension et le plan sont corrects.
> Sinon, dites-moi ce qui est inexact et je vais ajuster avant de coder.

**Règle absolue :** Si l'utilisateur ne dit pas OKAY (ou équivalent : "oui", "c'est bon", "go", "lance"), rester en Phase 3.

---

## Phase 4 — Implémenter (seulement après OKAY)

Une fois OKAY reçu :

1. Implémenter exactement comme décrit dans le plan approuvé — sans ajouts ni améliorations hors périmètre
2. Si une découverte change le plan → **stopper et re-présenter** avant de continuer
3. Après chaque fichier modifié, vérifier :
   ```bash
   npx tsc --noEmit 2>&1 | head -20
   npm run lint 2>&1 | head -20
   ```
4. Résumer les changements avec des références `fichier:ligne`

**Ne jamais committer** sauf demande explicite.

---

## Phase 5 — Créer l'issue GitHub

Une fois le travail implémenté et validé localement, invoquer `/create-issue` :

> Je crée maintenant l'issue GitHub correspondant au plan approuvé.

`/create-issue` va :
- Créer l'issue sur `African-DC/klassci-college-frontend` avec body structuré
- Demander : **toi-même** ou **assigner à un autre développeur** ?
- Si toi-même → enchaîner sur Phase 6

---

## Phase 6 — Worktree + Serveur de développement

Une fois l'issue créée, invoquer `/worktree-start <N>` :

Le worktree sera créé dans `../worktree-front-<N>-<slug>` (relatif à ce repo).

Ensuite proposer :

> Veux-tu que je lance le serveur de développement dans le worktree ?
> ```bash
> cd ../worktree-front-<N>-<slug>
> npm install   # si node_modules absent
> npm run dev   # démarre sur http://localhost:3000
> ```
> Ou tu le lances toi-même ?

Attendre la validation visuelle dans le navigateur avant de passer à la PR.

---

## Phase 7 — Pull Request

Quand tests et validation visuelle sont OK, invoquer `/worktree-finish` :
- Commit des changements
- Push de la branche
- PR vers `develop` avec `Closes #<N>` dans le body
- Retourner l'URL de la PR

---

## Phase 8 — Nettoyage

Après merge de la PR confirmé :

> La PR est mergée. Veux-tu nettoyer le worktree ?
> ```bash
> git worktree remove ../worktree-front-<N>-<slug>
> git worktree prune
> ```

---

## Règles

- **Jamais de code sans OKAY** — c'est la règle #1
- Baser toute analyse sur les fichiers réellement lus — jamais de suppositions
- Si le plan est rejeté, re-explorer puis présenter un plan révisé
- Un changement trivial (typo, chaîne de caractères) ne nécessite pas ce workflow

$ARGUMENTS
