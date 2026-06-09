import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const adjustSchema = z.object({
  quantity: z.number().int().min(1, "수량은 1 이상이어야 합니다."),
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
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = adjustSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { quantity, notes } = parsed.data

  const product = await prisma.product.findUnique({ where: { id: productId } })

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
  }

  if (product.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "ACTIVE 상태의 물품만 수량을 조정할 수 있습니다." },
      { status: 422 },
    )
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const performedBy = typeof user?.id === "number" ? user.id : Number(user?.id)

    await tx.productHistory.create({
      data: {
        productId,
        actionType: "ADJUST",
        quantity,
        performedBy,
        notes: notes ?? null,
      },
    })

    return tx.product.update({
      where: { id: productId },
      data: {
        quantity: product.quantity + quantity,
      },
    })
  })

  return NextResponse.json({ success: true, data: updatedProduct })
}
