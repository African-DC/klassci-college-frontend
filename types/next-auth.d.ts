import "next-auth"
import "next-auth/jwt"

export type UserRole = "admin" | "teacher" | "student" | "parent" | "super_admin"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    role: UserRole
    accessToken: string
    /**
     * Refresh token BE, capté côté serveur depuis le cookie httpOnly posé par
     * /auth/login. Stocké uniquement dans le JWT NextAuth chiffré (jamais
     * exposé au navigateur via la session) pour permettre le rafraîchissement
     * silencieux de l'access token.
     */
    refreshToken?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      role: UserRole
    }
    accessToken: string
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: UserRole
    accessToken: string
    /** Refresh token BE — server-side only, jamais propagé à la session client. */
    refreshToken?: string
    error?: string
  }
}
