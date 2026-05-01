import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authApi } from "@/lib/api/auth"
import { isTokenExpired } from "@/lib/utils/jwt"

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials.email as string
        const password = credentials.password as string

        if (!email || !password) return null

        try {
          const data = await authApi.login(email, password)
          return {
            id: String(data.user.id),
            email: data.user.email,
            role: data.user.role,
            accessToken: data.access_token,
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
        return token
      }

      // Return token if access token is still valid
      if (!isTokenExpired(token.accessToken)) {
        return token
      }

      // Access token expired — refresh is handled by httpOnly cookie on the backend
      // The frontend cannot read the refresh token (httpOnly).
      // For now, force re-login when access token expires.
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
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})
