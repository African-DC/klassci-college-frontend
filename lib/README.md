# lib/ — Librairies et utilitaires

Code partagé entre tous les composants. Organise par responsabilite.

| Dossier | Contenu | Pattern |
|---------|---------|---------|
| `api/` | Fonctions fetch HTTP | Un fichier par domaine |
| `hooks/` | Hooks TanStack Query | Un fichier par domaine |
| `stores/` | Stores Zustand | Un store par responsabilite |
| `validators/` | Schemas Zod | Un fichier par domaine |
| `utils/` | Helpers purs | Fonctions sans etat |

## Flux de donnees

```
Composant
  → useEnrollments()          lib/hooks/useEnrollments.ts
    → enrollmentsApi.list()   lib/api/enrollments.ts
      → fetch()               vers backend FastAPI
```

## Regles

- Jamais de fetch direct dans un composant
- Jamais de useEffect pour fetcher (TanStack Query uniquement)
- Les schemas Zod dans validators/ doivent correspondre aux Pydantic du backend
