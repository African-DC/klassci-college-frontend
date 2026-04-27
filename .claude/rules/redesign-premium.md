# Rule: Redesign Premium — Pattern Persona-First Ultra-Détaillé

## Quand s'active

Cette rule s'active automatiquement quand je :
- Audite une page/composant existant pour un redesign
- Ajoute une nouvelle feature majeure (>1 jour de dev)
- Transforme une UX cosmétique en UX persona-first
- Reçois un brief avec scope ambitieux (3+ features groupées)
- Vois un screenshot prod et l'utilisateur dit « il y a un problème de design »

## Principe fondamental

**Le persona-first ne consiste pas à « moins de features », mais à « features qui chacune amène à une action claire ».**

Chaque info affichée doit passer le test : *« Quel est le PROCHAIN tap que l'utilisateur va vouloir faire ? »*. Si la réponse est *« rien »*, l'info est du bruit.

Référence persona : Mme Diallo (52 ans, Itel S661, plein soleil, 3G, papier-based). Voir rule sœur `ux-target-user-reality.md`. **Le test ultime** : *« Mme Diallo, papier en main, peut-elle le faire sans formation ? »*.

---

## Le pattern de session — 7 étapes obligatoires

### 1. Audit ultrathink AVANT toute action

À partir d'un screenshot ou de la page live, lister TOUS les problèmes :
- **Bugs** (data fausses, états cassés, KPIs inconsistants)
- **Bruit** (info non-actionnable, redondance, démographie sans suite)
- **Manques** (info critique absente — ex : la classe d'un élève)
- **Friction** (taps inutiles, scroll inutile, états greyed invisibles plein soleil)

Puis ranker par **impact persona-first**, pas par effort.

### 2. /plan-and-confirm FULL avec critic

JAMAIS de redesign en `--quick`. Le critic doit pouvoir **BLOCK** :
- Scope trop large → split en PRs incrémentales
- Security gaps (PII export, bulk destructive sans confirm count)
- Pre-existing bugs masqués par le redesign
- Architecture qui aggrave la dette (god-class, drift de convention)

### 3. Si le critic dit RETHINK — écouter

Le critic peut splitter en N PRs. Ne pas pousser pour bundler. Re-discuter en passe 2 si désaccord, sinon implémenter ses changements. **Marcel peut override mais doit entendre le critic verbatim.**

### 4. Path A-refined > Path C original

Toujours préférer le **scope minimum qui transforme l'expérience persona**, défer le reste. La prod nous apprend plus que le brainstorm. Ship → mesurer → itérer.

### 5. Ship + Visual-check + Submit-test

Pas de « feature complete » sans :
- Render snapshot (AI accessibility)
- **Submit/CTA test** (mandatory pour formulaire/modal/badge actionable) — voir lesson 2026-04-27
- Mobile 375x812
- Hard reload post-deploy (cache bundle Next.js immutable)

### 6. Ultrathink retro

Après ship, revenir prendre du recul, sans coder :
- Ce qui a marché (à reproduire)
- Ce qui est imparfait (honest, pas de feel-good summary)
- Ce qui aurait été plus simple (simplification Da Vinci)
- Ce qui a été déféré (priorisation v1.2+ ranked par valeur/risque)
- Lessons (pour rules futures)

### 7. Cristalliser dans rule

Si un pattern est reproductible (chips bar, MobileEntityListItem, with_loader_criteria...), le coder UNE FOIS comme primitive partagée. Si une leçon est durable, l'écrire dans une rule (cette rule, ses sœurs).

---

## 12 principes de design — chacun avec exemple shippé

### 1. Subtitle > KPI cards démographiques

| ❌ | ✅ |
|---|---|
| 3 cards 200px de haut « Total: 5 / Garçons: 5 / Filles: 5 » (et bug-prone : 5/5/5 bug réel session 2026-04-27) | Subtitle 1 ligne `5 élèves au total · 4 à inscrire` (lien orange cliquable vers filtre) |

**Gain** : 200px verticaux + action immédiate. **Référence** : `/admin/students` PR #116.

### 2. Filter chips > select dropdowns

| ❌ | ✅ |
|---|---|
| Bouton « Filtres » ouvrant un panel avec 5 selects | Chips horizontal `Tous (5) · À inscrire (4) · 6ème A (1)`. 1 tap = 1 filtre |

**Gain** : 1 tap au lieu de 3, mobile-friendly horizontal-scroll, counts visibles. **Référence** : PR #117.

### 3. Statut « X à action » actionable > badge passif

| ❌ | ✅ |
|---|---|
| Badge gris « Pas inscrit cette année » (info sans suite) | Badge orange cliquable « À inscrire » → ouvre `/admin/enrollments?action=create&student_id=X` pré-rempli |

**Gain** : Wave Mobile Money style — chaque info = 1 tap vers action. 5 lignes de code, gain UX exponentiel.

### 4. Drop colonne, **garde data**

| ❌ | ✅ |
|---|---|
| Colonne `Genre` dédiée avec badge Masc/Fém | Mini ♀/♂ inline next to name. **Genre KEEP IN DATA** (DREN reports + bulletin honorifics + MENA forms) |

**Gain** : 1 colonne récupérée, data pas perdue. **Règle** : drop l'affichage, jamais le modèle, sans grep de toutes les consommations.

### 5. Mobile = liste minimal, PAS card

| ❌ | ✅ |
|---|---|
| Card avec 8 fields, action menu, photo grand format | List item minimaliste : avatar + name + secondary + status + chevron. Tap = fiche. |

**Gain** : 4 infos visibles, friction zéro, scroll rapide sur 3G. **Composant** : `<MobileEntityListItem>` partagé.

### 6. Helper text VISIBLE, pas juste greyed

| ❌ | ✅ |
|---|---|
| Subject Select disabled greyed (invisible plein soleil Itel S661) | Subject Select disabled + paragraphe `<p className="text-xs text-muted-foreground">Choisissez d'abord la classe</p>` sous le champ |

**Gain** : lisible plein soleil, intentionnalité claire. **Référence** : EvaluationCreateModal cascade.

### 7. Drop colonnes redondantes

| ❌ | ✅ |
|---|---|
| Colonne `Matricule` séparée + matricule en sous-titre du nom | Matricule **UNIQUEMENT** en sous-titre du nom |

**Gain** : densité utile, plus de bruit visuel.

### 8. Honest > impressive

| ❌ | ✅ |
|---|---|
| Frais column avec seuil `<30% rouge` en octobre = punit familles en plan échelonné (95% rouge faux) | Drop la colonne tant qu'on n'a pas `expected_so_far` schedule-aware. **Mieux pas de signal qu'un faux signal.** |

**Référence** : ultrathink 2026-04-27, déféré en v1.2.

### 9. shadcn/ui primitives, **jamais recréer**

✅ Toujours utiliser `Badge`, `Button`, `Checkbox`, `Progress` de shadcn/ui. Customisation via Tailwind, pas override de composant. Voir `components.md`.

### 10. Single accent + monochrome

| ❌ | ✅ |
|---|---|
| Garçons bleu, Filles rose, 4 statuts colorés = 6 accents | Primary KLASSCI bleu (`#0F3F8C`) + accent orange (`#F58220`). **Sémantique seulement** (succès/warning/erreur). |

Voir `marcel-global-preferences.md`.

### 11. Touch targets ≥ h-11

✅ Tous les boutons mobile : `h-11` minimum. Standard Wave Mobile Money. Voir `ux-target-user-reality.md`.

### 12. Français propre, pas d'em dash

✅ « Choisir une classe », pas « Pick » ni « Choisir — une classe ». Apostrophes courbes typographiques pas obligatoires mais accents OUI tous corrects.

---

## Architecture data — patterns

### `with_loader_criteria` > window function

Pour « latest related entity per parent » en SQLAlchemy 2.0 async :

```python
from sqlalchemy.orm import selectinload, with_loader_criteria

stmt = (
    select(Student)
    .options(
        selectinload(Student.enrollments).options(selectinload(Enrollment.class_)),
        with_loader_criteria(
            Enrollment,
            and_(
                Enrollment.academic_year_id == current_ay_id,
                Enrollment.status == EnrollmentStatus.VALIDE,
            ),
        ),
    )
)
```

`with_loader_criteria` filtre **AU NIVEAU SQL**. Combiné à une `UniqueConstraint(parent_id, scope_id)`, on a au plus 1 entité par parent. Plus simple que window function, MySQL-version-agnostic, pas de denorm column. **Référence** : PR #82.

### Endpoint counts vs enrichi list

Counts pour chips bar = **endpoint dédié** `/admin/<resource>/filters` cacheable.
**NE PAS** enrichir la liste paginée avec des aggregates (re-counts par page = waste, couples concerns).

### Single source of truth predicate

Quand un même filtre s'applique en list-side ET write-side validator, écrire le **prédicat SQLAlchemy** UNE FOIS et l'importer côté repo et côté validator. Zero drift entre filter et validation.

```python
def subject_for_class_predicate(class_obj: Class) -> ColumnElement[bool]:
    return and_(
        or_(Subject.level_id.is_(None), Subject.level_id == class_obj.level_id),
        or_(Subject.series_id.is_(None), Subject.series_id == class_obj.series_id),
    )
```

**Référence** : PR #76 cascade subjects.

### JSON column + Pydantic dump

`data.model_dump()` retourne types Python natifs (`datetime.date`, Enum). **Audit JSON column** nécessite `model_dump(mode="json")`. Sinon `TypeError` re-raised → 500 plain text → FE affiche « Erreur serveur » générique.

**Référence** : hotfix #80 audit JSON mode.

---

## Mobile responsive — pattern Tailwind

### `hidden md:block` + `md:hidden` (CSS-only, zéro JS)

```tsx
<div className="hidden md:block">
  <CrudTable ... />
</div>
<div className="space-y-2 md:hidden">
  {items.map(s => <MobileEntityListItem ... />)}
</div>
```

Un seul layout visible à la fois. Pas de JS viewport detection.

### `<MobileEntityListItem>` API

```typescript
interface MobileEntityListItemProps {
  href: string                          // CAST `as Route` côté consommateur (typedRoutes Next.js)
  avatar: ReactNode                     // Avatar partagé (photo + initials fallback)
  primary: ReactNode                    // Nom + ♀/♂ inline
  secondary?: ReactNode                 // Classe / matière / contexte
  status?: ReactNode                    // Badge optionnel (Valide / À inscrire / etc.)
}
```

Réutilisable sur `/admin/teachers`, `/staff`, `/parents`, `/classes`. Voir `components/shared/MobileEntityListItem.tsx`.

---

## Anti-patterns à bloquer en review

1. **3+ KPI cards en hero** sans action click possible → drop, mettre subtitle
2. **Bouton Filtres** boîte noire (pas de chips visibles) → chips toujours
3. **Colonne Genre / Sex** dédiée → mini-icône inline suffit
4. **Matricule colonne ET sous-titre** → un seul (sous-titre)
5. **Badge passif** sans next action → rendre cliquable ou drop
6. **Disabled greyed sans helper text visible** → ajouter paragraphe sous le champ
7. **Card mobile avec 8 fields** → MobileEntityListItem 4 props max
8. **Frais % avec seuil binaire** sans `expected_so_far` → drop ou refonte calcul
9. **Sort par matricule ASC** par défaut → toujours `nom ASC` (admin cherche par nom)
10. **Em dashes en français** (`—`) → virgule, point, ou rien
11. **Double rendering Table+Cards** sans `display:none` Tailwind → flicker
12. **Tests skip** sur endpoint sensible (PII export, bulk archive) → BLOCK PR
13. **`window.confirm()` ou `window.alert()`** → utiliser `<AlertDialog>` shadcn
14. **Tri par matricule alphabétique** comme ordre par défaut → tri par nom
15. **Bulk action sans confirm count exact** → « Archiver 50 élèves ? » avec count

---

## Pièges techniques pré-existants

### 1. `pnpm build` complet > `tsc --noEmit`

`tsc` standalone ne checke pas les **typedRoutes** Next.js. Toujours `pnpm build` complet en local OU laisser CI fail puis hotfix. **Lesson** : commit 3544123 hotfix Route cast.

### 2. Cache bundle Next.js `immutable`

Post-deploy, real users ouvrent l'app avec ANCIEN bundle (Cache-Control: immutable 1 an sur chunks). Hard reload (Ctrl+Shift+R) ou attendre nouveau deploy avec hash chunks différents. Voir `auth-architecture.md` section « Cache-bust ».

### 3. Branch hygiene en monorepo

`cd ... &&` chaîné dans Bash crée des cas limites où le commit part sur la mauvaise branche. **Toujours** `git branch --show-current` AVANT chaque commit important.

### 4. Visual-check ≠ feature-complete

Le visual-check valide le **render**, pas le **submit**. Pour modal/CTA/badge actionable, exercer le submit via `page.evaluate(fetch...)` et vérifier 2xx. Voir lesson session 2026-04-27 cascade subject.

### 5. Pydantic dump + JSON column

`data.model_dump()` → types Python (`date`, Enum). Audit JSON col attend strings → `TypeError` re-raised → 500 plain text. Toujours `model_dump(mode="json")` pour audit / JSON storage.

---

## Exemples de redesigns shippés (référence)

| Refonte | Issues | Patterns appliqués |
|---|---|---|
| Cascade Subject Select dans EvaluationCreateModal | BE #76, FE #112 | Predicate SQL unique partagé filter+validator, helper text visible disabled, drop dropdown noise |
| Mode Dictée vocale plein écran | BE #44, FE #108 | Voice + touch hybrid, retour audio plein soleil, persona Mme Diallo |
| Permissions Matrix UI | FE #108 | Hierarchique groupé 2 niveaux, recherche, pastilles |
| Students list redesign Persona | BE #82, FE #116 | Subtitle > KPI cards, chips bar, « À inscrire » badge actionable, MobileEntityListItem primitive, with_loader_criteria, drop noise |
| Hotfix audit JSON mode | BE #80 | mode=json convention drift fix |

---

## Pattern de session (template TL;DR)

```
1. /ultrathink → audit problèmes ranked persona-first
2. /plan-and-confirm FULL → critic 4-axes, accept RETHINK si valide
3. Path minimum viable enrichi (drop ce qui pas critique)
4. BE first (data + tests pytest), FE après
5. shared primitives (MobileEntityListItem, etc.) extracted day 1
6. /commit → push → PR feat→develop → merge
7. PR develop→main → deploy auto
8. /visual-check (render + SUBMIT TEST sur form/modal/badge)
9. /ultrathink retro → cristalliser patterns dans rules
10. /schedule agent dans 1-2 semaines pour collecter feedback persona réel
```

---

## Voir aussi

- `ux-target-user-reality.md` — persona Mme Diallo, anti-patterns mobile
- `components.md` — règles techniques composants Server/Client
- `forms.md` — patterns RHF + Zod
- `data-fetching.md` — TanStack Query patterns + invalidation
- `auth-architecture.md` — flow auth + cache-bust deploy
- `~/.claude/skills/visual-check/SKILL.md` — submit test mandatory (Step 4)
- `~/.claude/skills/plan-and-confirm/SKILL.md` — FULL mode + critic 4-axes
- `~/.claude/rules/marcel-global-preferences.md` — no AI slop, mobile-first, 1 accent color
- `klassci-backend/.claude/rules/python.md` — async + SQLAlchemy 2.0 + Pydantic v2
- Memory : `feedback_persona_first_design.md`, `feedback_be_fe_contract_drift.md`, `project_session_2026_04_27_students_redesign.md`
