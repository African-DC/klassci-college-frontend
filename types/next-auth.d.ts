import "next-auth"
import "next-auth/jwt"

export type UserRole = "admin" | "teacher" | "student" | "parent"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    role: UserRole
    accessToken: string
    refreshToken: string
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
    refreshToken: string
    error?: string
  }
}
