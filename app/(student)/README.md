# app/(student)/ — Portail Étudiant

Route group Next.js pour le portail étudiant. Mobile-first.

## Accès

Accessible aux élèves (login via `app.klassci.com` → redirect tenant → portail élève).
Lecture seule sur la plupart des sections.

## Structure des pages

```
app/(student)/
├── layout.tsx                    ← Layout étudiant (bottom navigation mobile)
├── page.tsx                      ← Redirect vers /student/dashboard
├── dashboard/
│   └── page.tsx                  ← Prochains cours, dernières notes, alertes
├── schedule/
│   └── page.tsx                  ← Mon emploi du temps
├── grades/
│   ├── page.tsx                  ← Mes notes par matière
│   └── bulletins/page.tsx        ← Mes bulletins (PDF téléchargeables)
├── attendance/
│   └── page.tsx                  ← Mon historique de présences / absences
├── fees/
│   └── page.tsx                  ← Mes frais scolaires + état des paiements
└── messages/
    └── page.tsx                  ← Messages de l'administration
```

## Règles

- Mobile-first absolu : bottom navigation (tabs), pas de sidebar
- Lecture seule — aucune action de modification
- Les bulletins PDF sont générés par le microservice Puppeteer côté backend
- Notifications push à prévoir en v2 (PWA)
