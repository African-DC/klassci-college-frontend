import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    role: string
    accessToken: string
    refreshToken: string
  }

  interface Session {
    user: {
      id: string
      email: string
      role: string
    }
    accessToken: string
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    role: string
    accessToken: string
    refreshToken: string
    error?: string
  }
}
