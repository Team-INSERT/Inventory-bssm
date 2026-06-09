import { type DefaultSession } from "next-auth"
import { type DefaultJWT } from "next-auth/jwt"
import { type Role } from "@/types"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: Role
    }
  }

  interface User {
    role?: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    role?: Role
  }
}
