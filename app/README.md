# app/ — Pages Next.js App Router

Les dossiers entre parentheses sont des route groups : ils n organisent pas l URL,
ils servent a partager des layouts et proteger les routes par portail.

## Portails

| Dossier | URLs | Utilisateurs | Interface |
|---------|------|--------------|-----------|
| `(auth)/` | `/login`, `/forgot-password` | Tous | Publique |
| `(admin)/` | `/dashboard`, `/enrollments`... | Staff admin | Desktop-first |
| `(teacher)/` | `/mes-classes`, `/notes`... | Enseignants | Desktop + Mobile |
| `(student)/` | `/mon-dossier`, `/mes-notes`... | Eleves | Mobile-first |
| `(parent)/` | `/suivi`, `/messages`... | Parents | Mobile-first |

## Pattern obligatoire par page

```
ma-page/
  page.tsx      Server Component (contenu principal)
  loading.tsx   Skeleton affiche pendant le chargement
  error.tsx     Gestion erreurs (Client Component obligatoire)
```

## Regles

- `page.tsx` = Server Component par defaut (pas de "use client")
- Create / Edit / Show-resume = **Modal** (pas de page separee)
- Show-complet / Dashboard / Stats = **Page** dedie
- Toujours un `loading.tsx` avec skeleton
