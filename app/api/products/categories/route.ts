import { NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const categories = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  })

  return NextResponse.json({
    success: true,
    data: categories.map(({ category }) => category).filter((category) => category.trim() !== ""),
  })
}
