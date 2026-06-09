import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"

import { EditProductForm } from "./edit-product-form"

function parseProductId(id: string) {
  const productId = Number.parseInt(id, 10)
  return Number.isNaN(productId) ? null : productId
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!session) {
    redirect("/login")
  }

  if (user?.role !== "ADMIN") {
    redirect("/products")
  }

  const { id } = await params
  const productId = parseProductId(id)

  if (productId === null) {
    notFound()
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    notFound()
  }

  if (product.status === "DISPOSED") {
    redirect(`/products/${productId}`)
  }

  return (
    <EditProductForm
      product={{
        id: product.id,
        productNumber: product.productNumber,
        productName: product.productName,
        category: product.category,
        specification: product.specification,
        quantity: product.quantity,
        acquisitionDate: product.acquisitionDate.toISOString().slice(0, 10),
        usefulLife: product.usefulLife,
        storageLocation: product.storageLocation,
        photoUrl: product.photoUrl,
        notes: product.notes,
      }}
    />
  )
}
