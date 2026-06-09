import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "오프라인 — 재고 관리",
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />

          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-white"
                aria-hidden="true"
              >
                <path d="M22 12A10 10 0 1 1 12 2" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
                <path d="M22 12h-4" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
              Network Offline
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              오프라인 상태입니다
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              재고 데이터는 네트워크 연결이 필요합니다.
              <br />
              연결을 확인한 후 다시 시도해주세요.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              다시 시도
            </Link>
            <p className="text-center text-xs leading-5 text-slate-500">
              연결이 복구되면 자동으로 접속됩니다
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
