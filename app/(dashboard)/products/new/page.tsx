import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

import { NewProductForm } from "./new-product-form"

export default async function NewProductPage() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!session) {
    redirect("/login")
  }

  if (user?.role !== "ADMIN") {
    redirect("/products")
  }

  return <NewProductForm />
}
