# components/ui/ — Shadcn/ui

Composants generés par Shadcn/ui. **Ne jamais modifier ces fichiers directement.**

## Ajouter un nouveau composant Shadcn

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add table
# etc.
```

## Composants utilises dans KLASSCI

- `button` — Boutons actions
- `dialog` — Modals (Create/Edit/Show)
- `table` — Tables CRUD
- `input` / `select` / `textarea` — Champs formulaires
- `badge` — Statuts (inscription, paiement...)
- `card` — Cartes de contenu
- `skeleton` — Loading states
- `toast` — Notifications flash
- `dropdown-menu` — Menus contextuels
- `form` — Wrapper React Hook Form

## Personnalisation

Surcharger via `tailwind.config.ts` (variables CSS) uniquement.
Ne pas modifier les fichiers dans ce dossier.
