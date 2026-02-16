# components/ — Composants React

Organises par portail et par usage.

| Dossier | Contenu | Regles |
|---------|---------|--------|
| `ui/` | Composants Shadcn/ui | Ne JAMAIS modifier ces fichiers |
| `shared/` | Composants partages entre portails | Sidebar, Navbar, Badge, Pagination... |
| `admin/` | Composants portail admin | Organises par domaine (enrollments/, fees/...) |
| `teacher/` | Composants portail enseignant | Grille de notes, EDT enseignant... |
| `forms/` | Formulaires React Hook Form | Un fichier par formulaire |

## Convention de nommage

```
EnrollmentCard.tsx        Composant principal
EnrollmentCardSkeleton.tsx Skeleton compagnon (obligatoire)
EnrollmentCreateModal.tsx  Modal de creation
EnrollmentEditModal.tsx    Modal de modification
```

## Regles

- Chaque composant async a son skeleton compagnon
- Create / Edit = toujours Modal (Shadcn Dialog)
- "use client" uniquement si necessaire (hooks, events, stores)
- Pas de fetch direct dans les composants, toujours via `lib/hooks/`
