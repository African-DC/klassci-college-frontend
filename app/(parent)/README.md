# app/(parent)/ — Portail Parent

Route group Next.js pour le portail parent. Mobile-first.

## Accès

Un parent peut suivre un ou plusieurs enfants inscrits dans l'établissement.
Compte créé par l'administration lors de l'inscription de l'élève.

## Structure des pages

```
app/(parent)/
├── layout.tsx                    ← Layout parent (bottom navigation mobile)
├── page.tsx                      ← Redirect vers /parent/dashboard
├── dashboard/
│   └── page.tsx                  ← Vue synthèse (absences récentes, notes, solde)
├── children/
│   ├── page.tsx                  ← Liste de mes enfants (si plusieurs)
│   └── [childId]/
│       ├── grades/page.tsx       ← Notes de cet enfant
│       ├── attendance/page.tsx   ← Absences de cet enfant
│       ├── schedule/page.tsx     ← Emploi du temps
│       ├── fees/page.tsx         ← Frais et paiements
│       └── bulletins/page.tsx    ← Bulletins PDF
└── messages/
    └── page.tsx                  ← Messagerie avec l'établissement
```

## Règles

- Mobile-first : bottom navigation (tabs), design épuré
- Multi-enfants : le parent peut switcher d'un enfant à l'autre facilement
- Lecture seule sur toutes les données scolaires
- Les SMS/WhatsApp de notification sont gérés backend — ce portail est le canal in-app
- Architecture prête en v1 même si l'accès parent est ouvert en v2
