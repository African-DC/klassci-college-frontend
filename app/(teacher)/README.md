# app/(teacher)/ — Portail Enseignant

Route group Next.js pour le portail enseignant. Tablette et mobile-friendly.

## Accès

Un enseignant voit uniquement ses classes (déterminées par l'EDT actif).
Le middleware Next.js vérifie le rôle `teacher` depuis le token JWT.

## Structure des pages

```
app/(teacher)/
├── layout.tsx                    ← Layout enseignant (navbar légère, menu mobile)
├── page.tsx                      ← Redirect vers /teacher/dashboard
├── dashboard/
│   └── page.tsx                  ← Mes cours du jour, alertes notes manquantes
├── schedule/
│   └── page.tsx                  ← Mon emploi du temps (semaine/jour)
├── grades/
│   ├── page.tsx                  ← Mes classes + état des évaluations
│   └── [classId]/
│       ├── page.tsx              ← Évaluations d'une classe
│       └── [evaluationId]/
│           └── page.tsx          ← Grille de saisie des notes
├── attendance/
│   ├── page.tsx                  ← Mes feuilles d'appel du jour
│   └── [classId]/page.tsx        ← Appel pour un cours spécifique
└── messages/
    └── page.tsx                  ← Messagerie interne (parents/admin)
```

## Règles spécifiques

- Priorité mobile : chaque composant doit fonctionner à 375px
- La saisie des notes (`GradeEntryGrid`) est optimisée pour la navigation clavier sur tablette
- Pas de modals larges — préférer les drawers ou les pages dédiées
- Les données chargées reflètent uniquement les classes de l'enseignant connecté
