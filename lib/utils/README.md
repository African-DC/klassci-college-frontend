# lib/utils/ — Helpers purs

Fonctions utilitaires sans état. Aucune dépendance vers TanStack Query, Zustand ou l'API.

## Convention

```ts
// Fonctions pures uniquement — input → output
// Pas de hooks, pas de fetch, pas d'état global

// lib/utils/format.ts
export function formatCurrency(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date, locale = 'fr-CI'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(date));
}

export function formatGrade(value: number, outOf = 20): string {
  return `${value.toFixed(2)}/${outOf}`;
}
```

## Fichiers à créer

| Fichier | Contenu |
|---------|---------|
| `format.ts` | formatCurrency, formatDate, formatGrade, formatPhone |
| `classnames.ts` | cn() — wrapper clsx + tailwind-merge (si pas via shadcn) |
| `academic.ts` | helpers système scolaire ivoirien (label série, niveau, trimestre) |
| `jwt.ts` | getToken(), isTokenExpired() — lecture cookie/localStorage |
| `pagination.ts` | calcul pages, offset, display "1-20 sur 150" |
| `attendance.ts` | statut présence → label + couleur badge |

## Règle

Aucune dépendance côté serveur. Ces fonctions peuvent être testées en isolation
avec Vitest sans mock.
