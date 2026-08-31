# Rule : Tout 401 client-side déclenche signOut + redirect /login?expired=1

## Quand s'active

Quand j'écris ou modifie un fichier `lib/api/*.ts` qui fait des fetches authentifiés vers le BE.

## Règle

**Aucun fetch authentifié ne doit ignorer un 401.** Le contrat est unique :

1. Le fetch reçoit 401 du BE → token expiré ou supprimé
2. Le client.ts appelle `handleExpiredSession()` (idempotent, one-shot)
3. NextAuth `signOut({ redirect: false })` clear le cookie session
4. Toast Sonner "Session expirée — Veuillez vous reconnecter"
5. Full reload `window.location.href = "/login?expired=1"`
6. Le `LoginForm` affiche un banner amber "Session expirée — Pour des raisons de sécurité, reconnectez-vous"

## Pourquoi

**Incident fondateur 2026-05-17, KLASSCI parent portail** :
- Mariam Koné loggée avec token valide
- Token JWT expire au bout de 15 min (TTL `auth.ts`)
- Fetches `/parent/dashboard` retournent 401 silencieusement
- TanStack Query retry × 3 → tous 401
- Affichage final : "Connexion au serveur impossible — Réessayer"
- Mariam clique "Réessayer" → encore 401 → **boucle infinie sans solution**

Le middleware `middleware.ts` redirige bien sur `session.error === "RefreshTokenError"`, mais **uniquement sur navigation server-side**. Les fetches TanStack/Zustand côté client n'ont pas ce filet.

## Pattern correct (canon `client.ts`)

```ts
import { getSession, signOut } from "next-auth/react"

let isHandlingExpiredSession = false

export async function handleExpiredSession(): Promise<void> {
  if (isHandlingExpiredSession) return
  if (typeof window === "undefined") return
  isHandlingExpiredSession = true
  sessionCache = null
  sessionPromise = null
  try {
    const { toast } = await import("sonner")
    toast.error("Session expirée", {
      description: "Veuillez vous reconnecter pour continuer.",
    })
  } catch { /* sonner not mounted yet */ }
  await signOut({ redirect: false }).catch(() => {})
  window.location.href = "/login?expired=1"
}

export async function apiFetch<T>(path: string, options = {}): Promise<T> {
  const res = await fetch(/* ... */)
  if (res.status === 401) {
    // CRITICAL: guard sur la présence de session AVANT signOut.
    // Sans ce guard, le post-login fire les fetches AVANT que le cookie
    // soit propagé à getSession() → 401 → signOut → redirect /login?expired=1
    // → l'utilisateur est éjecté juste après s'être connecté. Race condition.
    const session = await getCachedSession()
    if (session?.accessToken) {
      await handleExpiredSession()
    }
    throw new Error("Session expirée")
  }
  // ... rest
}
```

## Race condition apprise (2026-05-17)

**Symptôme** : user clique "Se connecter", submit OK côté NextAuth (cookie set), redirect vers `/parent/dashboard`. Pendant le mounting, le hook fire un fetch BE. La session n'est pas encore propagée au cache `getSession()` → pas de Authorization header → BE 401 → interceptor déclenche `signOut + redirect /login?expired=1`. **Boucle de login impossible**.

**Cause root** : `handleExpiredSession` ne distingue pas "token expiré" de "token pas encore propagé".

**Fix** : ne déclencher la session-expired flow QUE si on a réellement une session avec accessToken. Sinon, throw silencieux — le middleware redirect sur la nav suivante.

**Test régression** : login fresh → wait full propagation → URL doit être `/<portal>/dashboard` PAS `/login?expired=1`. Si jamais on voit le 2e cas, c'est le race qui re-fire.

## Fetches qui ne passent pas par `apiFetch` (multipart, etc.)

`apiFetch` sérialise en JSON : il n'est pas utilisable pour un `FormData`, où le
navigateur doit poser lui-même le `Content-Type` avec sa frontière multipart.

**Ne pas répliquer le contrat à la main.** Cette consigne, appliquée module par
module, a produit trois copies divergentes du même bloc (photo élève, photo de
profil, logo) avec chacune son `getBaseUrl()` et sa lecture d'erreur. Le contrat
vit maintenant dans `client.ts`, où `apiFetchMultipart` partage les en-têtes,
le gate `hadToken` et la lecture du `detail` backend avec `apiFetch` :

```ts
import { apiFetchMultipart } from "./client"

export const uploadPhoto = async (id: number, file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiFetchMultipart(`/admin/students/${id}/photo`, formData, {
    schema: PhotoUploadResponseSchema,
    context: "POST /admin/students/:id/photo",
    fallback: "Échec de l'envoi de la photo",
  })
}
```

De même pour un téléchargement : `apiFetchBlob`. Un `fetch` authentifié écrit à
la main dans `lib/api/*` est un défaut de revue, pas un cas particulier.

**Les six modules d'upload y passent** : `settings` (logo), `students` (photo),
`profile` (photo), `staff` (photo), `teachers` (photo) et `student-attachments`
(document). Il n'en reste aucun qui refasse le bloc.

Ce que la migration a corrigé au passage, et qui dit pourquoi la règle compte :
`staff` et `teachers` faisaient `throw new Error("Upload failed")`, jetant le
`detail` du backend. Or c'est lui qui dit « Fichier trop volumineux (max 5 Mo) »
ou « Format invalide. Accepté : JPEG, PNG, WebP ». Une secrétaire qui envoyait
une photo trop lourde lisait « Upload failed », en anglais, dans une interface
française, sans savoir quoi corriger.

**La seule exception légitime** est `verify.ts` : il poste vers
`/public/verify-file/...` sans en-tête d'autorisation, pour une vérification de
document faite par un tiers qui n'a pas de session. Il n'y a pas de 401 à
traiter, et il rend `null` sur toute erreur à dessein. Ne pas le « corriger ».

## Le banner `/login?expired=1`

`LoginForm` lit `searchParams.get("expired")` et affiche un banner amber avec `<Clock />` :

```tsx
const sessionExpired = searchParams.get("expired") === "1"

{sessionExpired && !error && (
  <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3.5">
    <Clock className="h-4 w-4 text-amber-600" />
    <p className="font-medium text-amber-900">Session expirée</p>
    <p className="text-xs text-amber-800">
      Pour des raisons de sécurité, reconnectez-vous pour continuer.
    </p>
  </div>
)}
```

Le banner disparaît dès que `setError` set le state error (priorité à l'erreur de login).

## Pourquoi `window.location.href` et pas `router.push`

- `signOut` invalide le cookie côté serveur, mais TanStack Query / Zustand gardent leur state en mémoire client
- `router.push("/login")` ne reset PAS ces stores → l'utilisateur après re-login pourrait voir des données stale
- `window.location.href` force un full page reload → tout est reset à zéro
- C'est le pattern standard SaaS (Notion, Linear, Vercel le font tous ainsi)

## Anti-patterns à bloquer en review

1. **`if (!res.ok) throw new Error(...)` sans test 401 distinct** — ignore l'expiration
2. **`fetch(...)` direct dans un composant** (au lieu de `lib/api/`) — pas couvert par l'intercepteur
3. **Toast "Erreur serveur" générique sur 401** — l'utilisateur ne sait pas quoi faire
4. **Retry TanStack `retry: true` infini sur 401** — boucle qui sature le BE
5. **Garder TanStack Query cache après expiration** — risque de fuite de PII
6. **`router.push("/login")` au lieu de `window.location.href`** — laisse le state client en place

## Checklist nouveau fichier `lib/api/*.ts`

- [ ] Utilise `apiFetch` quand possible (97% des cas)
- [ ] Si `FormData` : `apiFetchMultipart`. Si `Blob` : `apiFetchBlob`. Jamais un `fetch` à la main
- [ ] Pas de `fetch` direct sans le contrat 401
- [ ] Pas de `retry: Infinity` sur les queries qui hitte des endpoints auth-gated

## TanStack Query — `retry` recommandé

Pour éviter le 401-spam (qui exécuterait `handleExpiredSession` 4 fois mais en idempotent c'est OK), configurer :

```ts
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message === "Session expirée") return false
        return failureCount < 3
      },
    },
  },
})
```

## Voir aussi

- Memory `project_session_2026_05_17_portails_e2e.md` — incident fondateur
- Rule `auth-architecture.md` § "Refresh token" (mention TODO P1)
- Rule `api-client-zod-validation.md` — l'autre rule sur `lib/api/*`
- `auth.ts` callback jwt → `token.error = "RefreshTokenError"` (côté server seulement)
- `middleware.ts` → redirige sur session.error (côté server seulement)
