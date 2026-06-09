import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const [total, active, disposed, usedAgg] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "DISPOSED" } }),
    prisma.productHistory.aggregate({
      where: { actionType: "USE" },
      _sum: { quantity: true },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      total,
      active,
      disposed,
      usedQuantity: usedAgg._sum.quantity ?? 0,
    },
  })
}
