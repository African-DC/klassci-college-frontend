# lib/stores/ — Stores Zustand

État client uniquement (UI, préférences, état éphémère). Un store par responsabilité.

## Règle fondamentale

> Zustand = état client pur.
> TanStack Query = données serveur.
> Ne jamais dupliquer la data serveur dans un store Zustand.

## Convention

```ts
// lib/stores/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeModal: string | null;
  openModal:  (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeModal: null,
  openModal:  (id) => set({ activeModal: id }),
  closeModal: ()   => set({ activeModal: null }),
}));
```

## Stores à créer

| Fichier | Responsabilité |
|---------|---------------|
| `useUIStore.ts` | Sidebar open/close, modal active, loading global |
| `useAuthStore.ts` | Token JWT, utilisateur connecté, rôle/permissions chargés |
| `useFiltersStore.ts` | Filtres persistés par page (tri, pagination, recherche) |
| `useTimetableStore.ts` | Semaine active, vue semaine/jour, cellule sélectionnée |
| `useGradeEntryStore.ts` | Grille de saisie des notes (état local avant soumission) |

## Ce qui NE va PAS dans un store

- Les listes d'entités (élèves, profs, paiements...) → TanStack Query
- Les erreurs de formulaire → React Hook Form
- Les données de formulaire → React Hook Form
