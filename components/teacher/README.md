# components/teacher/ — Portail Enseignant

Composants exclusifs au portail enseignant. Organisés par fonctionnalité.

## Structure

```
components/teacher/
├── timetable/
│   ├── TeacherScheduleView.tsx    ← Vue personnelle de l'EDT de l'enseignant
│   └── TeacherScheduleSkeleton.tsx
├── grades/
│   ├── GradeEntryGrid.tsx         ← Grille de saisie des notes par classe
│   ├── GradeEntryForm.tsx         ← Formulaire d'une évaluation
│   └── GradesSummaryCard.tsx      ← Résumé notes pour une classe
├── attendance/
│   ├── AttendanceSheet.tsx        ← Feuille d'appel d'un cours
│   ├── AttendanceRow.tsx          ← Ligne par élève (Présent/Absent/Retard)
│   └── AttendanceSummary.tsx      ← Tableau bord absences par classe
└── dashboard/
    └── TeacherDashboard.tsx       ← Page d'accueil (mes classes, prochains cours)
```

## Accès dynamique

Un enseignant voit **uniquement** les classes dans lesquelles il a des créneaux
dans l'emploi du temps actif. Le backend filtre automatiquement. Le frontend
n'a pas à gérer ce filtrage — les hooks retournent déjà les données filtrées.

## Convention composants

- Tous les composants ici sont **Client Components** (`'use client'`) — interactivité requise
- Les données viennent de `lib/hooks/useGrades.ts`, `lib/hooks/useTimetable.ts`, etc.
- Pas de fetch direct — toujours via les hooks
- Skeleton companion pour chaque composant de données

## Règle mobile

Le portail enseignant est utilisé sur tablette et mobile (saisie des notes en classe).
Chaque composant doit être testable à 375px de largeur.
