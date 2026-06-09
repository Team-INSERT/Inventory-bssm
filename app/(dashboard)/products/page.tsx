import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { ProductsClient } from "./products-client"

export default async function ProductsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = session.user as { role?: string } | undefined

  return <ProductsClient canCreateProducts={user?.role === "ADMIN"} />
}
