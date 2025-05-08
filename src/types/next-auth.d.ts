import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    role: string
    image?: string | null
  }

  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
