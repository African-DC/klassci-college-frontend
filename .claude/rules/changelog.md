# Règle Changelog — KLASSCI College Frontend

Le fichier `CHANGELOG.md` à la racine documente les évolutions du portail
**du point de vue de l'utilisateur final** (admin, enseignant, parent,
élève). Il suit
[Keep a Changelog 1.1.0](https://keepachangelog.com/fr/1.1.0/) et
[Semantic Versioning](https://semver.org/lang/fr/).

## Quand alimenter

| Type de commit                                         | Action sur le changelog |
|--------------------------------------------------------|--------------------------|
| `feat:` qui ajoute ou modifie une page, un écran, un parcours utilisateur | **Oui** → `Added` ou `Changed` |
| `fix:` d'un bug visible (UI cassée, action qui n'aboutit pas) | **Oui** → `Fixed`        |
| `style:` purement esthétique mais qui change ce qui est visible (refonte hero, tableau premium) | **Oui** → `Changed` |
| `perf:` ressenti à l'usage (page plus rapide, skeleton fluide) | **Oui** → `Changed`     |
| `refactor:` qui ne change rien à ce que voit l'user    | **Non**                  |
| `chore:` / `docs:` / `test:` / `ci:`                   | **Non**                  |
| Faille corrigée, dépendance bumpée pour CVE            | **Oui** → `Security`     |

> **Règle d'or** : si la ligne ne dit pas *« ce que Mme Diallo (52 ans,
> Itel S661, papier) peut faire de plus, mieux, ou différemment »*, elle
> ne devrait pas être là.

## Comment écrire une entrée

1. **Perspective utilisateur, pas développeur.**
   - ❌ « Refactored `GradeEntryGrid` to use `useDebounce` and Zustand store »
   - ✅ « Saisie des notes plus fluide : la sauvegarde se déclenche après
     une courte pause au lieu d'à chaque frappe *(enseignant)* »

2. **Français propre, accents corrects.** Voir
   `marcel-global-preferences.md` (no em dashes en français).

3. **Persona en italique** à la fin de la ligne :
   `*(admin)*`, `*(enseignant)*`, `*(parent)*`, `*(élève)*`,
   `*(tous)*` (= tous les portails). **Pas de persona** si vraiment
   transverse infra (ex : monitoring).

4. **Lien PR** quand identifiable : `(#108)` à la fin.

5. **Une ligne, ≤ 25 mots.** Si ça déborde, c'est probablement deux
   entrées différentes.

6. **Pas de jargon technique** : aucune mention de composants React
   (DicteeMode, GradesSupervisor...), de hooks (`useTanstack`,
   `usePermissions`...), de libs (shadcn/ui, RHF, TanStack Query...),
   de fichiers (`app/(admin)/...`). On décrit *ce que ça fait*, pas
   *avec quoi c'est fait*.

7. **Mobile-first dans l'esprit** : si une feature est cruciale pour
   l'usage terrain (3G + écran TFT entry-level + plein soleil), le
   préciser. Ex : « Mode dictée plein écran lisible en plein soleil
   *(enseignant)* ».

## Où l'ajouter

Toujours sous `## [Unreleased]` au sommet du fichier, dans la section
appropriée. Si la section n'existe pas encore dans `Unreleased`, la
créer dans cet ordre canonique (sauter celles vides) :

```
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
```

## Quand bumper la version

| De            | À             | Critère                                                     |
|---------------|---------------|-------------------------------------------------------------|
| `0.1.0-alpha` | `0.1.0`       | Première école pilote tournée 30 jours sans incident P0     |
| `0.1.x`       | `0.2.0`       | Nouvelle capacité majeure (ex : portail élève complet)      |
| `0.x.y`       | `1.0.0`       | 5 écoles en production payante, SLA tenu 60 jours           |
| `X.Y.Z`       | `X.Y.(Z+1)`   | Patch — fix bugs, sans nouvelle capacité                    |
| `X.Y.Z`       | `X.(Y+1).0`   | Minor — nouvelle capacité, rétrocompatible                  |
| `X.Y.Z`       | `(X+1).0.0`   | Major — breaking change pour les utilisateurs (ex : refonte d'un portail) |

À chaque release :

1. Renommer `## [Unreleased]` en `## [X.Y.Z] - YYYY-MM-DD` (date du tag).
2. Recréer un bloc `## [Unreleased]` vide au sommet.
3. Mettre à jour les liens compare en bas du fichier :
   ```
   [unreleased]: https://github.com/African-DC/klassci-college-frontend/compare/vX.Y.Z...HEAD
   [X.Y.Z]: https://github.com/African-DC/klassci-college-frontend/compare/vX.Y.W...vX.Y.Z
   ```
4. Tagger : `git tag vX.Y.Z` puis `git push --tags`.

## Anti-patterns à bloquer en revue

1. Entrée qui décrit l'implémentation : `Added DicteeMode component`
2. Entrée qui mentionne un fichier ou un dossier App Router : `app/(teacher)/...`
3. Entrée qui ne dit pas *quoi*, juste *pourquoi internal* : `Cleaner state machine`
4. Section `## [Unreleased]` absente ou vide bloquée à plusieurs commits feat
5. Date au format autre qu'ISO 8601 (`YYYY-MM-DD`)
6. Sections vides laissées dans le fichier (les supprimer)
7. Mélange français / anglais dans les entrées
8. Lister 30 commits CRUD au lieu de méga-grouper en une feature

## Exemples corrects

```markdown
### Added
- Mode dictée vocal plein écran pour saisir les notes sans regarder
  l'écran, optimisé plein soleil *(enseignant)* (#108)
- Création d'évaluation déléguée : un admin peut créer une évaluation
  au nom d'un enseignant, l'audit trace qui a saisi *(admin)* (#108)

### Changed
- Sauvegarde des notes après une courte pause au lieu d'à chaque
  frappe : moins de scintillement, plus de fluidité *(enseignant)*

### Fixed
- Liste des enseignants apparaissait vide dans le formulaire de création
  d'évaluation côté admin *(admin)* (#109)

### Security
- Vérification stricte de l'hôte sur chaque requête : seuls les domaines
  autorisés peuvent atteindre le portail (#106, #107)
```

## Voir aussi

- `klassci-college-backend/.claude/rules/changelog.md` — règle équivalente
  côté BE (entrées séparées dans le CHANGELOG.md du backend)
- `klassci-frontend/CHANGELOG.md` — fichier alimenté
- Rule `rules/git.md` — formats de commit qui alimentent les sections
- Rule `rules/ux-target-user-reality.md` — persona Mme Diallo
