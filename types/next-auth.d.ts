import "next-auth"
import "next-auth/jwt"

export type UserRole =
  | "admin"
  | "director"
  | "staff"
  | "accountant"
  | "teacher"
  | "student"
  | "parent"
  | "super_admin"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    role: UserRole
    accessToken: string
    /**
     * Prénom et nom réels, renvoyés par `/auth/login`. Sans eux, les écrans
     * retombaient sur le début de l'adresse e-mail : le caissier Ibrahim
     * Tanoh était accueilli par « Bonjour, Cashier3 ». Facultatifs, car une
     * session créée avant leur introduction n'en porte pas.
     */
    firstName?: string
    lastName?: string
    /** Mot de passe temporaire à changer à la 1re connexion. */
    mustChangePassword?: boolean
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
      firstName?: string
      lastName?: string
      mustChangePassword?: boolean
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
    firstName?: string
    lastName?: string
    mustChangePassword?: boolean
    /** Refresh token BE — server-side only, jamais propagé à la session client. */
    refreshToken?: string
    error?: string
  }
}
