import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DisposedProductsClient } from "./disposed-products-client"

export default async function DisposedPage() {
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
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">폐기 목록</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          폐기된 물품을 확인하고 상세 화면으로 이동할 수 있습니다.
        </p>
      </div>

      <DisposedProductsClient />
    </section>
  )
}
