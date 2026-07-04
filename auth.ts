import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authApi } from "@/lib/api/auth"
import { getTokenTenant, isTokenExpired } from "@/lib/utils/jwt"

/**
 * Fenêtre d'inactivité avant expiration de la session (mode veille). La
 * session NextAuth est glissante : tant que l'utilisateur est actif, elle se
 * prolonge ; après IDLE_TIMEOUT sans interaction, le cookie expire et la
 * déconnexion est forcée. Voir SessionKeepAlive pour le déclencheur côté
 * client (déconnexion proactive + maintien de l'access token frais).
 */
const IDLE_TIMEOUT_SECONDS = 30 * 60 // 30 minutes
/** Re-rotation du cookie de session au plus une fois par cette fenêtre. */
const SESSION_UPDATE_SECONDS = 5 * 60 // 5 minutes
/**
 * Marge avant l'expiration de l'access token BE (15 min) à partir de laquelle
 * on déclenche un refresh. 5 min : large devant l'intervalle de poll client
 * (2 min) pour qu'aucune requête ne parte avec un token déjà expiré.
 */
const ACCESS_TOKEN_REFRESH_MARGIN_SECONDS = 5 * 60

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        tenant_code: {},
      },
      async authorize(credentials) {
        const email = credentials.email as string
        const password = credentials.password as string
        // ``tenant_code`` is the user-facing tenant slug, sourced by the
        // LoginForm from the URL query (?c=<slug>) or the persisted
        // cookie. Forwarded to the BE via X-Tenant-Slug so the
        // TenantMiddleware can resolve the correct tenant DB before
        // checking credentials. Empty/undefined → BE falls back to
        // LOCAL_TENANT_ID (super-admin login pattern).
        const tenantCode = (credentials.tenant_code as string | undefined) || undefined

        if (!email || !password) return null

        try {
          const data = await authApi.login(email, password, tenantCode)
          return {
            id: String(data.user.id),
            email: data.user.email,
            role: data.user.role,
            accessToken: data.access_token,
            refreshToken: data.refreshToken ?? undefined,
            mustChangePassword: data.user.must_change_password,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email!
        token.role = user.role
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.mustChangePassword = user.mustChangePassword
        token.error = undefined
        return token
      }

      // Access token encore valide (hors marge de refresh) → on garde.
      if (
        token.accessToken &&
        !isTokenExpired(token.accessToken, ACCESS_TOKEN_REFRESH_MARGIN_SECONDS)
      ) {
        return token
      }

      // Access token proche de l'expiration → refresh silencieux via le
      // refresh token BE (rotation). Tant que l'utilisateur reste actif, le
      // SessionKeepAlive déclenche ce callback assez tôt pour qu'aucune
      // requête ne parte avec un token périmé.
      if (token.refreshToken) {
        try {
          const refreshed = await authApi.refresh(
            token.refreshToken,
            getTokenTenant(token.accessToken) ?? undefined,
          )
          token.accessToken = refreshed.access_token
          if (refreshed.refreshToken) token.refreshToken = refreshed.refreshToken
          token.error = undefined
          return token
        } catch {
          // Le refresh a échoué. Cause la plus fréquente : COURSE DE ROTATION.
          // Le refresh token BE est à usage unique (rotation) ; un autre appel
          // jwt concurrent (navigation via middleware, SessionKeepAlive,
          // useSession) l'a déjà consommé et rotaté, invalidant notre copie.
          // Tant que l'access token courant n'est PAS réellement expiré, on
          // GARDE la session : le prochain appel jwt lira le cookie rafraîchi
          // par l'appel gagnant et repartira propre. On ne déconnecte QUE si
          // l'access token est vraiment périmé (vraie fin de session côté
          // inactivité, ou refresh durablement cassé). Sans ça, un utilisateur
          // ACTIF était éjecté au moindre refresh concurrent.
          if (token.accessToken && !isTokenExpired(token.accessToken, 0)) {
            token.error = undefined
            return token
          }
          token.error = "RefreshTokenError"
          return token
        }
      }

      // Pas de refresh token (sessions d'avant cette feature) → re-login.
      token.error = "RefreshTokenError"
      return token
    },
    async session({ session, token }) {
      // Always expose accessToken so client tooling can inspect it
      // (debugging dashboards, network panel verification).
      session.accessToken = token.accessToken

      if (token.error) {
        // Refresh token error : the access token is expired and no
        // silent refresh is implemented yet (see auth-architecture.md
        // pièges #2). Surface the error and DO NOT propagate the stale
        // identity. Consumers using `session?.user?.X` will see
        // undefined fields and either fall back gracefully or trigger
        // their not-authenticated branch. The middleware redirects to
        // /login on session.error before any protected route renders.
        session.error = token.error
        return session
      }

      session.user.id = token.id
      session.user.email = token.email
      session.user.role = token.role
      session.user.mustChangePassword = token.mustChangePassword
      return session
    },
  },
  session: {
    strategy: "jwt",
    // Session glissante : expire IDLE_TIMEOUT après la DERNIÈRE activité
    // (chaque lecture de session pendant que l'utilisateur est actif reporte
    // l'échéance). C'est le comportement « mode veille » : actif → maintenue,
    // inactif au-delà de la fenêtre → déconnexion.
    maxAge: IDLE_TIMEOUT_SECONDS,
    updateAge: SESSION_UPDATE_SECONDS,
  },
})
