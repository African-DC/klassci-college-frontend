# Règles Git — KLASSCI Frontend

## Format des Commits (Conventionnel)

```
<type>(<scope>): <description courte en impératif anglais>
```

**Types :** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`

**Scopes frontend :** `auth`, `enrollments`, `fees`, `timetable`, `grades`,
`attendance`, `notifications`, `dashboard`, `settings`, `ui`, `i18n`

**Règles :**
- Description ≤ 72 caractères
- Impératif anglais : "add" pas "added"
- PAS de "Generated with Claude Code" ni "Co-Authored-By"

**Exemples corrects :**
```
feat(enrollments): add enrollment creation modal with fee preview
fix(auth): redirect to correct portal after login
feat(dashboard): add real-time notification badge via WebSocket
style(ui): update status badge colors to match design system
test(grades): add grade entry form validation tests
```

## Branches — identiques au backend

```
main / staging / develop / feature/* / fix/* / hotfix/*
```

**Toujours brancher depuis `develop`.**

## La barrière qui ne se contourne pas

`hygiene-commits.yml` rejoue sur la pull request ce que les hooks disent en
local, là où `--no-verify` ne sert plus à rien :

| Contrôle | Ce qu'il refuse |
|---|---|
| Messages de commit | un **titre de PR** non conventionnel ou de plus de 65 caractères ; dans les commits de la branche, une signature automatique, un message non conventionnel, un sujet > 72 caractères, un `WIP` |
| Corps de la pull request | mention d'outil de génération dans la description |
| Revue de qualité déclarée | un diff qui touche du code sans ligne `Review:` dans un commit |

**Le titre compte plus que les commits.** Une fusion écrasée vers `develop`
prend pour sujet le titre de la PR, suivi de « (#NNN) ». D'où la limite à 65 :
72 moins la place du numéro. Sur les 300 derniers commits de `develop`, 78
(backend) et 83 (frontend) dépassent 72 caractères, presque tous des titres de
PR, qu'aucun hook local ne voit jamais.

**Une mise en production ne rejuge rien.** Une PR dont la tête est `develop` ou
`staging` porte des commits déjà partagés : leur défaut ne se corrige plus
qu'en réécrivant une branche protégée. Les rejuger bloquerait chaque mise en
production.

Ce contrôle manquait, et ça se voyait : deux commits du backend portent une
ligne `Co-Authored-By` que la règle interdit depuis le premier jour. Le
frontend, lui, est indemne. Les hooks locaux les auraient refusés ; personne
ne les avait rejoués côté serveur.

Il ne lit que des messages, donc il répond en quelques secondes et ne dépend
d'aucune installation. Il ne tourne que sur pull request : signaler une fusion
après coup, quand la seule correction est de réécrire une branche partagée,
n'aide personne.

**Requis seulement une fois la protection appliquée.** Au 2026-09-22, aucune
branche n'était protégée sur les deux dépôts : l'API GitHub renvoyait 404 pour
`develop` comme pour `main`. Tant que `scripts/setup-branch-protection.sh`
(dans le dépôt backend, il couvre les deux) n'a pas été lancé, ces contrôles
s'affichent sur la PR mais n'empêchent aucune fusion.