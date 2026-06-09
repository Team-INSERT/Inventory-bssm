import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function parseProductId(id: string) {
  const productId = Number.parseInt(id, 10)
  return Number.isNaN(productId) ? null : productId
}

const listHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { id } = await params
  const productId = parseProductId(id)
  if (productId === null) {
    return NextResponse.json({ error: "INVALID_PRODUCT_ID" }, { status: 400 })
  }

  const searchParams = req.nextUrl.searchParams
  const parsed = listHistoryQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { page, limit } = parsed.data
  const skip = (page - 1) * limit

  const [total, histories] = await Promise.all([
    prisma.productHistory.count({ where: { productId } }),
    prisma.productHistory.findMany({
      where: { productId },
      orderBy: { performedAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true } } },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return NextResponse.json({
    success: true,
    data: histories,
    meta: { page, limit, total, totalPages },
  })
}
