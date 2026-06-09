import { auth, signOut } from "@/lib/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LogOut, Map, Package, Trash2, Users } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = session.user as
    | { name?: string | null; role?: string }
    | undefined
  const isAdmin = user?.role === "ADMIN"

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 md:h-screen md:overflow-hidden md:flex-row">
      {/* 모바일 상단 헤더 */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 pt-[env(safe-area-inset-top)] md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Inventory Control
          </p>
          <h1 className="text-base font-semibold tracking-tight text-white">재고 관리</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-200">{user?.name || "사용자"}</p>
            <p className="text-xs text-slate-500">{isAdmin ? "관리자" : "사용자"}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </form>
        </div>
      </header>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-white md:flex md:h-screen">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Inventory Control
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">재고 관리</h1>
          <p className="mt-2 text-sm text-slate-300">{user?.name || "사용자"}</p>
          <p className="mt-1 text-xs text-slate-500">{isAdmin ? "관리자" : "사용자"}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <Link
            href="/products"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Package className="h-5 w-5" />
            <span>물품 관리</span>
          </Link>

          <Link
            href="/map"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Map className="h-5 w-5" />
            <span>학교 지도</span>
          </Link>

          {isAdmin ? (
            <>
              <Link
                href="/disposed"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trash2 className="h-5 w-5" />
                <span>폐기 목록</span>
              </Link>
              <Link
                href="/users"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Users className="h-5 w-5" />
                <span>사용자 관리</span>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>로그아웃</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto md:h-screen">
        <div className="p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 md:p-8 md:pb-8">{children}</div>
      </main>

      {/* 모바일 하단 네비 */}
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
