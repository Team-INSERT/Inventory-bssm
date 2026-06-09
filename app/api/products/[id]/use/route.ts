import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const useProductSchema = z.object({
  quantity: z.number().int().min(1),
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

  const parsed = useProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { quantity, notes } = parsed.data
  const userId = Number.parseInt(String(session.user.id), 10)

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
  }

  if (product.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "ACTIVE 상태의 물품만 사용처리할 수 있습니다." },
      { status: 422 },
    )
  }

  if (quantity > product.quantity) {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "사용 수량은 현재 수량을 초과할 수 없습니다." },
      { status: 422 },
    )
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    await tx.productHistory.create({
      data: {
        productId,
        actionType: "USE",
        quantity,
        performedBy: userId,
        notes: notes ?? null,
      },
    })

    return tx.product.update({
      where: { id: productId },
      data: {
        quantity: product.quantity - quantity,
      },
    })
  })

  return NextResponse.json({ success: true, data: updatedProduct })
}
