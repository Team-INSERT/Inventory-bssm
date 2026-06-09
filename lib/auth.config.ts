import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtected =
        !nextUrl.pathname.startsWith("/login") &&
        !nextUrl.pathname.startsWith("/api/auth")

      if (isOnProtected) {
        if (isLoggedIn) return true
        return false
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
