"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

type LoginTab = "user" | "admin"

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<LoginTab>("user")
  const [pin, setPin] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleUserLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("pin-login", {
      pin,
      redirect: false,
    })

    if (result?.error) {
      setError("PIN 번호가 올바르지 않습니다.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  async function handleAdminLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("admin-login", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  const tabButtonClass = (value: LoginTab) =>
    [
      "flex-1 border-b-2 px-4 py-3 text-center text-sm font-medium transition-colors",
      tab === value
        ? "border-slate-900 text-slate-950"
        : "border-transparent text-slate-500 hover:text-slate-800",
    ].join(" ")

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Inventory Control
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              재고 관리 시스템
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              물품 관리를 위한 시스템에 로그인하세요
            </p>
          </div>

          <div className="mt-8 flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setTab("user")} className={tabButtonClass("user")}>
              사용자 로그인 (PIN)
            </button>
            <button
              type="button"
              onClick={() => setTab("admin")}
              className={tabButtonClass("admin")}
            >
              관리자 로그인
            </button>
          </div>

          {error ? (
            <div
              className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {tab === "user" ? (
            <form onSubmit={handleUserLogin} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium text-slate-700">
                  PIN 번호
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="4-6자리 숫자"
                  autoComplete="one-time-code"
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl tracking-[0.35em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  required
                />
                <p className="text-center text-xs leading-5 text-slate-500">
                  PIN 번호는 4~6자리 숫자입니다
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          ) : null}

          {tab === "admin" ? (
            <form onSubmit={handleAdminLogin} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  autoComplete="current-password"
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  )
}
