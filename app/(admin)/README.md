# app/(admin)/ — Portail Administration

Route group Next.js pour tout le portail administration. Desktop-first.
Accessible uniquement aux comptes avec rôle admin (configurable via RBAC dynamique).

## Structure des pages

```
app/(admin)/
├── layout.tsx                    ← Layout admin (sidebar + navbar + toasts)
├── page.tsx                      ← Redirect vers /dashboard
├── dashboard/
│   └── page.tsx                  ← Vue d'ensemble KPIs
├── enrollments/
│   ├── page.tsx                  ← Liste des inscriptions (TanStack Table)
│   └── [id]/page.tsx             ← Détail inscription
├── students/
│   ├── page.tsx                  ← Liste élèves
│   └── [id]/page.tsx             ← Profil complet élève
├── teachers/
│   ├── page.tsx                  ← Liste enseignants
│   └── [id]/page.tsx             ← Profil enseignant
├── staff/
│   ├── page.tsx                  ← Liste personnel admin
│   └── [id]/page.tsx             ← Profil membre staff
├── classes/
│   └── page.tsx                  ← Gestion des classes
├── subjects/
│   └── page.tsx                  ← Gestion des matières
├── fees/
│   ├── page.tsx                  ← Configuration des frais
│   └── variants/page.tsx         ← Variants de frais par profil
├── payments/
│   └── page.tsx                  ← Suivi des paiements
├── timetable/
│   └── page.tsx                  ← Gestion EDT + génération automatique
├── grades/
│   └── page.tsx                  ← Supervision des notes
├── attendance/
│   └── page.tsx                  ← Supervision des présences
├── bulletins/
│   └── page.tsx                  ← Génération et envoi des bulletins
├── notifications/
│   └── page.tsx                  ← Gestion des notifications
├── roles/
│   ├── page.tsx                  ← Liste des rôles
│   └── [id]/page.tsx             ← Permissions d'un rôle (RBAC granulaire)
└── settings/
    └── page.tsx                  ← Configuration de l'établissement
```

## Règles

- Chaque `page.tsx` est un **Server Component** par défaut
- Le data fetching initial se fait côté serveur (prefetch TanStack Query)
- Les interactions (Create/Edit/Delete) ouvrent des **modals** — pas de navigation
- Chaque page a son `loading.tsx` (Skeleton) et `error.tsx` (message + retry)
- Les tables utilisent TanStack Table v8 via `components/admin/[domaine]/`

## Pattern de page type

```tsx
// app/(admin)/students/page.tsx
import { StudentsList } from '@/components/admin/students/StudentsList';

export default function StudentsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Élèves</h1>
        <button data-modal="student-create" className="btn btn-primary">Ajouter</button>
      </div>
      <StudentsList />
    </div>
  );
}
```
