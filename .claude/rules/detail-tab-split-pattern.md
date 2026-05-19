# Rule : Split d'un tab détail god-code en sous-composants cohérents

## Quand s'active

Quand je redesigne un `XxxTab.tsx` d'une fiche détail (`/admin/students/[id]`, `/admin/teachers/[id]`, etc.) et qu'il dépasse :

- 250 LOC (soft limit `no-god-code.md`)
- ET/OU contient à la fois : list rendering + multiple modals + sub-forms + state machine d'unlink/delete

## Règle

**Splitter en 5 fichiers** sous un dossier dédié `components/admin/<entity>/<subdomain>/` :

1. **`XxxTab.tsx`** (orchestration ~150-200 LOC) — reste dans `tabs/`. Hook fetch + state machines (modal targets, unlink target). Importe les 4 autres. **Exporte la même API publique** (props identiques) → zéro breaking change downstream.
2. **`XxxCard.tsx`** (~100-150 LOC) — display d'1 entité unique. Reçoit `entity` + callbacks d'action en props.
3. **`XxxCreateModal.tsx`** (~150-250 LOC) — Dialog standalone pour création (form RHF + Zod).
4. **`XxxLinkModal.tsx`** (~120-150 LOC) — Dialog standalone pour lier une entité existante (recherche + sélection).
5. **`xxx-helpers.ts`** ou **`relationship.ts`** (~20-30 LOC) — helpers purs (labels, tones, URLs computed).

## Pourquoi cette répartition

- **Single responsibility** : chaque fichier répond à 1 question (display 1 item ? render le tab ? créer ? lier ?)
- **Cohérence visuelle** : le Card peut être réutilisé ailleurs (ex: inline dans OverviewTab) sans copier-coller
- **Modals indépendantes** : ouvrir l'une ou l'autre via un `DropdownMenu` au lieu d'un toggle complexe dans une seule Dialog
- **Helper file** : centralise les labels FR + tones pour éviter le drift entre Card display et select options des modals
- **TypeScript** : exporter les types d'entité depuis le contract Zod (`@/lib/contracts/<entity>.ts`) — pas dans les sous-components

## Pattern reproductible (template)

```
components/admin/students/
├── tabs/
│   ├── _primitives.tsx          ← SectionCard, StatusPill, EmptyState, InitialsAvatar (partagé)
│   └── ParentsTab.tsx           ← orchestrateur (213 LOC)
└── parents/
    ├── relationship.ts          ← helper labels/tones (30 LOC)
    ├── ParentCard.tsx           ← 1 card display (153 LOC)
    ├── ParentCreateModal.tsx    ← Dialog create new (255 LOC)
    └── ParentLinkModal.tsx      ← Dialog link existing (208 LOC)
```

## Application _primitives obligatoire

Le tab redesigned **doit** utiliser les primitives partagées de `tabs/_primitives.tsx` :

- `SectionCard` pour le wrapper principal (avec icon + serif title + action right)
- `StatusPill` pour tous les badges (tone semantic ou neutral)
- `InitialsAvatar` pour les contacts sans photo
- `EmptyState` pour le cas vide (avec CTA admin actionnable)

**Pas de re-création** d'un Card/Badge/Avatar custom. Si une variante manque dans `_primitives`, l'ajouter au module partagé.

## Actions persona-first (touch targets h-11)

Pour un contact (parent, teacher, parent d'élève), exposer en boutons inline grands :

- **Appeler** : `<a href="tel:${phone}">` — Wave Mobile Money style
- **WhatsApp** : `<a href="https://wa.me/${digits}" target="_blank">` — phone cleaned (`replace(/[^\d]/g, "")`)
- **Email** : `<a href="mailto:${email}">`

Actions secondaires (SMS, edit, unlink) → dans un `DropdownMenu` kebab top-right de la card.

**Touch targets** : `className="h-11 sm:h-10"` (Itel S661 ≥ 44dp, desktop confort ≥ 40dp).

## Anti-patterns à bloquer en review

1. **God tab > 500 LOC** : split obligatoire avant merge
2. **Card display redéfini inline** dans le tab orchestrateur → extraire en `<XxxCard>` même si utilisé 1× (sera réutilisé dans OverviewTab inline)
3. **Modal create + link fusionnée** avec toggle Tab interne (≥ 300 LOC) → splitter en 2 modals indépendantes ouvrables via `DropdownMenu`
4. **Helper labels/tones inline** répétés entre Card et form Select → extraire dans `relationship.ts` / `<entity>-helpers.ts`
5. **Actions cachées dans kebab uniquement** quand persona Type B mobile (boutons inline manquants) → exposer Appeler/WhatsApp/Email inline
6. **`h-9` ou `h-10` mobile** sans `h-11` fallback → fail le test Mme Aïcha (Itel S661 plein soleil)
7. **EmptyState sans CTA** pour role admin → ajouter `<Button>` qui ouvre la create/link modal directement

## Bénéfices mesurés

Refonte `ParentsTab` 2026-05-17 :
- **Avant** : 1 god file 604 LOC, modal `AddParentDialog` interne avec toggle 2 modes (300 LOC sur 604)
- **Après** : 5 fichiers (213 + 153 + 255 + 208 + 30 = 859 LOC réparties)
- **Différence** : +255 LOC totales mais chaque fichier <260 LOC, lisible, testable, réutilisable
- **API publique préservée** : `<ParentsTab studentId={id} />` import identique dans `StudentDetailClient.tsx` → zéro breaking change
- **Réutilisabilité** : `ParentCard` réutilisable dans OverviewTab inline si on veut harmoniser plus tard
- **Persona-first** : 3 actions inline touch h-11 (Appeler/WhatsApp/Email) au lieu d'1 bouton Unlink masqué

## Voir aussi

- `redesign-premium.md` principe 13 (AvatarImage 404-safe) + principe 14 (tri-état badge sémantique)
- `components.md` — Server vs Client + pattern Modal
- `~/.claude/rules/no-god-code.md` — seuils LOC + détection
- Memory `project_session_2026_05_17_parentstab_split.md` — implémentation détaillée
