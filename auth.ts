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
            refreshToken: data.refresh_token,
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
        return token
      }

      // Return token if access token is still valid
      if (!isTokenExpired(token.accessToken)) {
        return token
      }

      // Access token expired — try to refresh
      try {
        const refreshed = await authApi.refresh(token.refreshToken)
        token.accessToken = refreshed.access_token
        token.refreshToken = refreshed.refresh_token
        token.error = undefined
        return token
      } catch {
        token.error = "RefreshTokenError"
        return token
      }
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.email = token.email
      session.user.role = token.role
      session.accessToken = token.accessToken
      if (token.error) {
        session.error = token.error
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})
