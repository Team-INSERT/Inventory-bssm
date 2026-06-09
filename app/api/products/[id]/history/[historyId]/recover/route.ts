import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const recoverSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
})

function parseProductId(id: string) {
  const productId = Number.parseInt(id, 10)
  return Number.isNaN(productId) ? null : productId
}

function parseHistoryId(id: string) {
  const historyId = Number.parseInt(id, 10)
  return Number.isNaN(historyId) ? null : historyId
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> },
) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const user = session?.user as unknown as { role?: string; id?: number } | undefined
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id, historyId: rawHistoryId } = await params
  const productId = parseProductId(id)
  if (productId === null) {
    return NextResponse.json({ error: "INVALID_PRODUCT_ID" }, { status: 400 })
  }

  const historyId = parseHistoryId(rawHistoryId)
  if (historyId === null) {
    return NextResponse.json({ error: "INVALID_HISTORY_ID" }, { status: 400 })
  }

  let body: unknown
  try {
    const rawBody = await req.text()
    body = rawBody.trim() === "" ? {} : JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = recoverSchema.safeParse(body)
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

  if (product.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "ACTIVE 상태의 물품만 복구할 수 있습니다." },
      { status: 422 },
    )
  }

  const historyItem = await prisma.productHistory.findFirst({
    where: { id: historyId, productId, actionType: "USE" },
  })

  if (!historyItem) {
    return NextResponse.json(
      { error: "HISTORY_NOT_FOUND", message: "사용 이력을 찾을 수 없습니다." },
      { status: 404 },
    )
  }

  if (historyItem.quantity === null || historyItem.quantity <= 0) {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "복구할 수량이 유효하지 않습니다." },
      { status: 422 },
    )
  }

  const existingRecover = await prisma.productHistory.findFirst({
    where: {
      productId,
      actionType: "RECOVER",
      sourceHistoryId: historyId,
    },
  })

  if (existingRecover) {
    return NextResponse.json(
      { error: "BUSINESS_RULE_VIOLATION", message: "이미 복구된 사용 이력입니다." },
      { status: 422 },
    )
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const performedBy = typeof user?.id === "number" ? user.id : Number(user?.id)
    const recoverQuantity = historyItem.quantity!

    await tx.productHistory.create({
      data: {
        productId,
        actionType: "RECOVER",
        quantity: recoverQuantity,
        performedBy,
        sourceHistoryId: historyId,
        notes: parsed.data.notes ?? null,
      },
    })

    return tx.product.update({
      where: { id: productId },
      data: {
        quantity: product.quantity + recoverQuantity,
      },
    })
  })

  return NextResponse.json({ success: true, data: updatedProduct })
}
