import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      const publicPaths = [
        "/login",
        "/api/auth",
        "/~offline",
        "/manifest.webmanifest",
        "/sw.js",
        "/icons/",
        "/apple-touch-icon.png",
      ]

      const isPublic = publicPaths.some((path) => pathname.startsWith(path))

      if (isPublic) return true

      return isLoggedIn
    },
  },
  providers: [],
} satisfies NextAuthConfig
