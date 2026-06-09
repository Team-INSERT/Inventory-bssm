import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const restoreSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
})

function parseProductId(id: string) {
  const productId = Number.parseInt(id, 10)
  return Number.isNaN(productId) ? null : productId
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const user = session?.user as unknown as { role?: string; id?: number } | undefined
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id } = await params
  const productId = parseProductId(id)
  if (productId === null) {
    return NextResponse.json({ error: "INVALID_PRODUCT_ID" }, { status: 400 })
  }

  let body: unknown
  try {
    const rawBody = await req.text()
    body = rawBody.trim() === "" ? {} : JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
  }

  if (product.status !== "DISPOSED") {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "DISPOSED 상태의 물품만 복구할 수 있습니다." },
      { status: 422 },
    )
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const performedBy = typeof user?.id === "number" ? user.id : Number(user?.id)

    await tx.productHistory.create({
      data: {
        productId,
        actionType: "RESTORE",
        quantity: null,
        performedBy,
        notes: parsed.data.notes ?? null,
      },
    })

    return tx.product.update({
      where: { id: productId },
      data: {
        status: "ACTIVE",
        quantity: product.quantity + (product.disposedQuantity ?? 0),
        disposedAt: null,
        disposedQuantity: null,
      },
    })
  })

  return NextResponse.json({ success: true, data: updatedProduct })
}
