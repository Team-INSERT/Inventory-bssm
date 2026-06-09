import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/db"
import type { Role } from "@/types"
import { authConfig } from "./auth.config"

const pinLoginSchema = z.object({
  pin: z
    .string()
    .length(4, "PIN은 4자리여야 합니다")
    .or(z.string().length(5, "PIN은 5자리여야 합니다"))
    .or(z.string().length(6, "PIN은 6자리여야 합니다")),
})

const adminLoginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "pin-login",
      name: "PIN Login",
      credentials: {
        pin: { label: "PIN", type: "text", placeholder: "1234" },
      },
      async authorize(credentials) {
        const parsed = pinLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { pin: parsed.data.pin },
        })

        if (!user || !user.isActive || user.role !== "USER") return null

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findFirst({
          where: { email: parsed.data.email },
        })

        if (!user || !user.isActive || user.role !== "ADMIN" || !user.password)
          return null

        const isValid = await bcrypt.compare(parsed.data.password, user.password)
        if (!isValid) return null

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as Role
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id
        if (typeof token.role === "string") session.user.role = token.role as Role
      }

      return session
    },
  },
})
