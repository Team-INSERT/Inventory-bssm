import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UsersManagement } from "@/components/users/users-management"

export default async function UsersPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!session) {
    redirect("/login")
  }

  if (user?.role !== "ADMIN") {
    redirect("/products")
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Dashboard</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">사용자 관리</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          사용자 목록을 확인하고 계정을 추가, 수정, 비활성화할 수 있습니다.
        </p>
      </div>

      <UsersManagement />
    </section>
  )
}
