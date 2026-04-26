---
paths:
  - "auth.ts"
  - "middleware.ts"
  - "next.config.ts"
  - "lib/api/**"
  - "lib/contracts/auth.ts"
  - "components/forms/LoginForm.tsx"
  - "app/(auth)/**"
  - "app/api/auth/**"
---

# Architecture Auth — KLASSCI College (FE perspective)

## Principe

KLASSCI College utilise un **système d'auth hybride** : Python (FastAPI) fait l'authentification, NextAuth.js v5 gère la session côté browser. **Ne pas remplacer l'un par l'autre** — les deux sont nécessaires et complémentaires.

## Schéma A → Z du flow login

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ BROWSER  https://college.klassci.com                                         │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 1) GET /login
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ nginx :443  (TLS, single-domain college.klassci.com)                         │
│   location /api/auth/  → :3000 (FE NextAuth handler)                         │
│   location /api/       → :8000 (BE FastAPI — ATTENTION conflit potentiel)    │
│   location /static/    → fichiers statiques BE                               │
│   location /           → :3000 (FE Next.js pages)                            │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 2) Render LoginForm (React Hook Form + Zod)
       │    components/forms/LoginForm.tsx
       │
       │ 3) Submit → signIn("credentials", { email, password, redirect: false })
       │    Browser fait POST /api/auth/callback/credentials  (via NextAuth)
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ FE Next.js :3000  (auth.ts, NextAuth handler)                                │
│   1. NextAuth route handler reçoit POST /api/auth/callback/credentials       │
│   2. Invoke authorize() callback (auth.ts:16-33)                             │
│   3. authorize() appelle authApi.login(email, password)                      │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 4) lib/api/auth.ts:19 — fetch ${NEXT_PUBLIC_API_URL}/auth/login
       │    (server-side fetch, runs in Node.js — pas de CSP, pas de mixed-content)
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ BE FastAPI :8000  (app/routers/auth.py)                                      │
│   POST /auth/login  (prefix="/auth", PAS /api/auth)                          │
│   1. TenantMiddleware résout tenant_id (JWT > X-Tenant-Slug > subdomain)     │
│   2. Vérifie email + bcrypt hash, génère access_token (JWT 15min)            │
│   3. Génère refresh_token, set comme cookie HttpOnly Secure                  │
│   4. Returns { access_token, token_type, user }                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 5) Response remontée à authorize()
       │    return { id, email, role, accessToken } (auth.ts:24-29)
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ NextAuth callbacks (auth.ts:36-67)                                           │
│   jwt() → {id, email, role, accessToken, error?} dans le NextAuth JWT        │
│   session() → expose ces fields dans session.user / session.accessToken      │
│   Set cookie authjs.session-token (HttpOnly, Secure, SameSite=Lax)           │
│   Returns { ok: true, url: NEXTAUTH_URL+callbackUrl }                        │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 6) LoginForm.tsx:53 — router.push(callbackUrl)
       │    Browser navigue vers https://college.klassci.com/admin/dashboard
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ middleware.ts                                                                │
│   1. Host allowlist (lib/utils/allowed-hosts.ts) — rejette si Host douteux   │
│   2. NextAuth auth() vérifie session                                         │
│   3. Vérifie role ↔ portal (admin → /admin/, teacher → /teacher/, etc.)     │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 7) /admin/dashboard rendu côté server (RSC)
       │    Sidebar + page.tsx + AdminDashboard component
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Browser — TanStack Query déclenche les fetches data                          │
│   useDashboardKpis(), useRecentActivity() etc.                               │
│   → fetch ${NEXT_PUBLIC_API_URL}/admin/dashboard, /admin/students, ...       │
│   → Headers: Authorization: Bearer <access_token from session>               │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       │ 8) ⚠️ POINT CRITIQUE : ces fetches sont CLIENT-SIDE
       │    Ils sont sujets à CSP connect-src + mixed-content browser policy.
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ BE FastAPI :8000 — endpoints data                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Variables d'environnement critiques

| Var | Server-side ? | Client-side ? | Valeur correcte | Effet si faux |
|---|---|---|---|---|
| `NEXTAUTH_URL` | Oui | Non | `https://college.klassci.com` | Redirect login va vers HTTP IP → mixed-content blocked |
| `NEXTAUTH_SECRET` | Oui | Non | string >= 32 chars | NextAuth refuse de signer le JWT |
| `AUTH_TRUST_HOST` | Oui | Non | `true` (HTTPS prod) | NextAuth refuse les cookies cross-origin |
| `NEXT_PUBLIC_API_URL` | Oui | **Inliné au build** | `https://college.klassci.com/api-be` (avec rewrites) OU `https://college.klassci.com` | Si HTTP+IP : mixed-content sur tous les fetches client-side |
| `NEXT_PUBLIC_ALLOWED_HOST_PATTERN` | Non | Inliné au build | regex single-domain | Hosts non matchés rejetés en 400 |

⚠️ **`NEXT_PUBLIC_*` est inliné au build time**. Changer la valeur dans `.env.local` ne fait RIEN tant qu'on ne rebuild pas. C'est une string literal dans le bundle JS.

## Le problème "mixed-content"

**Symptôme** : login fonctionne (redirect HTTPS OK), mais la dashboard charge en skeleton infini, les CRUD ne marchent pas, les notifications ne s'affichent pas.

**Cause** : `NEXT_PUBLIC_API_URL` pointe vers `http://...` (HTTP) ou vers `http://<IP>:8000` direct. Le browser, sur une page HTTPS, bloque tous les fetches HTTP (politique mixed-content). Les fetches échouent silencieusement → loading infini.

**Vérification** : DevTools console → "Mixed Content: was loaded over HTTPS, but requested an insecure resource".

## Fix — patron Next.js rewrites

Pour que les fetches client-side soient HTTPS same-origin **sans** rebuilder le BE et **sans** ajouter de locations nginx pour chaque router BE :

```ts
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api-be/:path*',
      destination: 'http://127.0.0.1:8000/:path*',
    },
  ]
},
```

Plus :
- `NEXT_PUBLIC_API_URL=https://college.klassci.com/api-be` (build-time)
- nginx config inchangée (le `/api-be/` tombe dans `location /` → :3000 où le rewrite intercepte)
- Browser fetche `https://college.klassci.com/api-be/auth/login` → Next.js rewrite proxy → BE :8000 ✅

### Alternative : prefix BE avec /api/

Refactor BE pour préfixer tous les routers avec `/api/v1/` (en évitant `/api/auth/` qui est réservé NextAuth). Plus propre mais touche tous les `app.include_router()` + tous les contrats FE.

## Pièges connus

1. **NextAuth client routes (`/api/auth/*`) doivent atteindre Next.js, PAS le BE.** Si nginx route `/api/` au BE sans exception pour `/api/auth/`, le login casse en 404 FastAPI.

2. **`AUTH_TRUST_HOST=true` est obligatoire en prod multi-tenant**. Sans ça, NextAuth refuse les cookies sur des hôtes non-match avec `NEXTAUTH_URL`. Mais avec `true`, on doit valider explicitement le Host header dans `middleware.ts` (host allowlist) sinon vulnérable au host header injection.

3. **`server.env.local` vs `.next/standalone/.env.local`** : Next.js standalone copie `.env.local` dans le standalone à la fin du build. En prod, c'est ce dernier qui est lu. Les modifs sur `klassci-frontend/.env.local` post-build ne prennent PAS effet sans `cp .env.local .next/standalone/` + restart service.

4. **Refresh token** : géré par cookie HttpOnly sur le BE. Le FE NE PEUT PAS le lire. Quand l'access_token expire, `auth.ts:48-56` met `token.error = "RefreshTokenError"` qui force re-login. Pas de refresh transparent côté FE pour l'instant — TODO P1.

5. **Multi-tenant** : le `tenant_id` est dans le JWT signé par le BE. Le `TenantMiddleware` BE le re-extrait à chaque requête. Si on switch de tenant sans re-login, on a un mismatch JWT vs DB target.

## Endpoints concernés (FE perspective)

| Endpoint | Type | Doit atteindre | Pourquoi |
|---|---|---|---|
| `/login` | GET | FE :3000 | Page login (Next.js) |
| `/api/auth/callback/credentials` | POST | FE :3000 (NextAuth) | NextAuth client posts here on signIn |
| `/api/auth/session` | GET | FE :3000 (NextAuth) | Session check |
| `/api/auth/csrf` | GET | FE :3000 (NextAuth) | CSRF token |
| `/api/auth/signout` | POST | FE :3000 (NextAuth) | Logout |
| `/auth/login` | POST | BE :8000 | Real auth (called by NextAuth authorize() server-side) |
| `/auth/refresh` | POST | BE :8000 | Token refresh (server-side only) |
| `/admin/students` etc. | GET/POST/PUT/DELETE | BE :8000 | Data CRUD (called client-side) |

## Anti-patterns à bloquer

1. Remplacer NextAuth par "juste utiliser le JWT BE direct" → casse le pattern session HttpOnly + le pattern role → portal middleware
2. Remplacer le BE auth par OAuth provider externe (Google, etc.) sans garder le JWT BE → casse les calls API qui exigent `Authorization: Bearer <jwt-be>`
3. Mettre `NEXTAUTH_URL=http://<IP>:port` en prod HTTPS → mixed-content au redirect
4. Mettre `NEXT_PUBLIC_API_URL=http://...` en prod HTTPS → mixed-content sur tous les fetches client-side
5. Exposer le refresh_token au browser via `Authorization` ou autre → casse la défense CSRF/XSS du HttpOnly
6. Faire confiance au `tenant_id` venant du body de la requête → Middleware doit le re-vérifier depuis le JWT signé

## Voir aussi

- `klassci-college-backend/.claude/rules/auth-architecture.md` — perspective BE (routes FastAPI, middleware tenant)
- `klassci-college-frontend/.claude/rules/deploy.md` — pourquoi pas de rebuild sur EC2 prod
- CDC v2 ligne 38 — "Auth | NextAuth.js v5"
- `auth.ts` — l'unique source de vérité du flow NextAuth + authorize()
- `middleware.ts` — host allowlist + role ↔ portal redirects
- `lib/api/auth.ts` + `lib/api/client.ts` — base URL + bearer token wiring
