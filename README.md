# KLASSCI College - Frontend

Frontend Next.js du systeme de gestion scolaire KLASSCI College.

## Stack
- **Next.js 15** App Router · **TypeScript strict** · **Tailwind CSS** · **Shadcn/ui**
- **TanStack Query v5** · **Zustand** · **React Hook Form + Zod** · **TanStack Table**
- **Recharts** · **next-intl** · **NextAuth.js v5**

## Structure

```
app/
  (auth)/          Pages publiques (login, mot de passe oublie)
  (admin)/         Portail administration (desktop-first)
  (teacher)/       Portail enseignant
  (student)/       Portail etudiant (mobile-first)
  (parent)/        Portail parent (mobile-first)
components/
  ui/              Composants Shadcn (ne pas modifier)
  shared/          Composants partages entre portails
  admin/           Composants portail admin
  teacher/         Composants portail enseignant
  forms/           Formulaires React Hook Form
lib/
  api/             Fonctions fetch vers le backend
  hooks/           Hooks TanStack Query
  stores/          Stores Zustand
  validators/      Schemas Zod (miroir du Pydantic backend)
  utils/           Helpers purs
```

## Demarrage

```bash
cp .env.local.example .env.local
npm install
npm run dev
# App : http://localhost:3000
```

## Variables requises

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de l API backend |
| `NEXT_PUBLIC_WS_URL` | URL WebSocket backend |
| `NEXTAUTH_SECRET` | Secret NextAuth (openssl rand -hex 32) |
| `NEXTAUTH_URL` | URL de l app (ex: http://localhost:3000) |

## Commandes

```bash
npm run dev        # Developpement
npm run build      # Build production
npm run lint       # ESLint
npx tsc --noEmit   # Verification TypeScript
npm run test       # Tests Vitest
```

## Workflow Git

```
feature/* → develop → staging → main
```
Toujours brancher depuis `develop`. PR obligatoire. CI doit passer.

## Claude Skills

`/commit` · `/code-review` · `/create-pr` · `/new-component [Name] [type]` · `/new-page [portal/path]`
