# KLASSCI Collège — Frontend (Next.js)

## Stack
- **Next.js 15** App Router (Server Components par défaut)
- **TypeScript** strict
- **Tailwind CSS** + **Shadcn/ui** pour les composants
- **TanStack Query v5** pour le server state (fetch, cache, mutations)
- **Zustand** pour le client state (UI state, modals, etc.)
- **React Hook Form** + **Zod** pour les formulaires
- **TanStack Table v8** pour les tableaux CRUD
- **Recharts** pour les graphiques et dashboards
- **next-intl** pour l'internationalisation
- **NextAuth.js v5** pour l'authentification

## Architecture

```
app/
├── (auth)/              ← pages publiques (login, etc.)
├── (admin)/             ← portail administration
│   ├── dashboard/
│   ├── enrollments/
│   ├── fees/
│   ├── timetable/
│   └── ...
├── (teacher)/           ← portail enseignant
├── (student)/           ← portail étudiant
└── (parent)/            ← portail parent

components/
├── ui/                  ← composants Shadcn (ne pas modifier)
├── shared/              ← composants partagés entre portails
├── admin/               ← composants spécifiques admin
├── teacher/             ← composants spécifiques enseignant
└── forms/               ← formulaires React Hook Form

lib/
├── api/                 ← fonctions fetch vers le backend
├── hooks/               ← hooks custom TanStack Query
├── stores/              ← Zustand stores
├── contracts/           ← schémas Zod (contrats API partagés)
└── utils/               ← helpers purs
```

## Design System — Couleurs (basées sur le logo KLASSCI)

| Token        | HSL                 | Hex approx  | Usage                                      |
|-------------|---------------------|-------------|---------------------------------------------|
| `primary`   | `216 80% 30%`       | `#0F3F8C`   | Bleu foncé du logo — boutons, liens, nav    |
| `accent`    | `28 91% 54%`        | `#F58220`   | Orange du logo — CTA secondaires, highlights |

- **Toujours utiliser** `bg-primary`, `text-primary`, `bg-accent`, `text-accent` — jamais de bleu/orange hardcodé
- Les couleurs sémantiques (emerald=succès, amber=warning, rose=erreur) restent autorisées pour les indicateurs de statut
- Les palettes de différenciation (matières, catégories) peuvent utiliser des couleurs Tailwind variées

## Règles Absolues

### Composants
- Server Components par défaut — `"use client"` seulement si nécessaire
- `"use client"` requis pour : hooks, event handlers, Zustand, modals
- Jamais de `useEffect` pour fetcher des données — utiliser TanStack Query
- Jamais de `fetch` direct dans les composants — toujours via `lib/api/`

### UX Obligatoire
- Skeleton loader sur chaque composant async (pas de spinner global)
- Chaque composant se met à jour indépendamment (invalidation TanStack Query ciblée)
- Create / Edit / Show-résumé = **toujours des modals** (Shadcn Dialog)
- Show-complet / Dashboard / Stats = page dédiée
- Realtime via WebSocket pour notes, notifications, présences

### Sécurité
- Jamais de données sensibles dans le localStorage
- Tokens JWT dans des cookies httpOnly (gérés par NextAuth)
- Toujours vérifier les permissions côté serveur (pas seulement masquer les boutons)
- Sanitiser toute donnée affichée avec les mécanismes React (pas de dangerouslySetInnerHTML)

### Nommage
- Fichiers composants : `PascalCase.tsx`
- Fichiers utilitaires : `kebab-case.ts`
- Hooks : `useResourceAction.ts` (ex: `useEnrollments.ts`)
- Stores Zustand : `useResourceStore.ts` (ex: `useModalStore.ts`)

## Commandes Utiles

```bash
# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint
npx tsc --noEmit

# Tests
npm run test
npm run test:e2e
```

## Imports dans les fichiers
@rules/components.md
@rules/forms.md
@rules/data-fetching.md
@rules/deploy.md
@rules/git.md
