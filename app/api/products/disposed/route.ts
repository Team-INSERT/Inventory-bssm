import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const listDisposedProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const parsed = listDisposedProductsQuerySchema.safeParse({
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

  const disposedWhere = { disposedAt: { not: null } }

  const [total, products] = await Promise.all([
    prisma.product.count({ where: disposedWhere }),
    prisma.product.findMany({
      where: disposedWhere,
      orderBy: [{ disposedAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take: limit,
      select: {
        id: true,
        productNumber: true,
        productName: true,
        category: true,
        quantity: true,
        storageLocation: true,
        status: true,
        disposedAt: true,
        disposedQuantity: true,
        updatedAt: true,
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return NextResponse.json({
    success: true,
    data: products,
    meta: { page, limit, total, totalPages },
  })
}
