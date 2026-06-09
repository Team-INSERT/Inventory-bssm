import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const photoUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .refine((value) => {
    if (value == null) return true

    return (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      (value.startsWith("data:image/") && value.length <= 1_000_000)
    )
  }, {
    message: "photoUrl은 http(s) URL 또는 1MB 이하의 data:image/ URL이어야 합니다.",
  })

const productListSelect = {
  id: true,
  productNumber: true,
  productName: true,
  category: true,
  specification: true,
  quantity: true,
  acquisitionDate: true,
  usefulLife: true,
  storageLocation: true,
  photoUrl: true,
  notes: true,
  status: true,
  disposedAt: true,
  disposedQuantity: true,
  createdAt: true,
  updatedAt: true,
}

const createProductSchema = z.object({
  productNumber: z
    .string()
    .regex(/^\d{8}-\d{8}$/, "물품번호 형식이 올바르지 않습니다. (예: 20240001-0001)"),
  productName: z.string().min(1, "물품명을 입력하세요.").max(100),
  category: z.string().min(1, "분류를 입력하세요.").max(50),
  specification: z.string().max(200).optional().nullable(),
  quantity: z.number().int().min(0, "수량은 0 이상이어야 합니다."),
  acquisitionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "유효한 날짜 형식이 아닙니다.",
  }),
  usefulLife: z.number().int().min(0).optional().nullable(),
  storageLocation: z.string().min(1, "보관 위치를 입력하세요.").max(100),
  photoUrl: photoUrlSchema,
  notes: z.string().max(500).optional().nullable(),
})

const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  productNumber: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    },
    z
      .string()
      .regex(/^\d{8}-(?:\d{4}|\d{8})$/, "물품번호 형식이 올바르지 않습니다. (예: 20240001-0001)")
      .optional(),
  ),
  q: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(100).optional(),
  ),
  category: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(50).optional(),
  ),
  storageLocation: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    },
    z.string().max(100).optional(),
  ),
  status: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed.toUpperCase() : undefined
    },
    z.enum(["ACTIVE", "DISPOSED", "ALL"]).optional(),
  ),
})

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const parsed = listProductsQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    productNumber: searchParams.get("productNumber") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    storageLocation: searchParams.get("storageLocation") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { page, limit, productNumber, q, category, storageLocation, status } = parsed.data

  if (productNumber) {
    const product = await prisma.product.findUnique({
      where: { productNumber },
      select: productListSelect,
    })

    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  }

  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = status === "ALL" ? {} : { status: status ?? "ACTIVE" }

  if (q) {
    where.productName = { contains: q }
  }

  if (category) {
    where.category = category
  }

  if (storageLocation) {
    where.storageLocation = storageLocation
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: productListSelect,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return NextResponse.json({
    success: true,
    data: products,
    meta: { page, limit, total, totalPages },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const {
    productNumber,
    productName,
    category,
    specification,
    quantity,
    acquisitionDate,
    usefulLife,
    storageLocation,
    photoUrl,
    notes,
  } = parsed.data

  const existing = await prisma.product.findUnique({ where: { productNumber } })
  if (existing) {
    return NextResponse.json(
      { error: "DUPLICATE_PRODUCT_NUMBER", message: "이미 사용 중인 물품번호입니다." },
      { status: 409 },
    )
  }

  const newProduct = await prisma.product.create({
    data: {
      productNumber,
      productName,
      category,
      specification: specification || null,
      quantity,
      acquisitionDate: new Date(acquisitionDate),
      usefulLife: usefulLife ?? null,
      storageLocation,
      photoUrl: photoUrl || null,
      notes: notes || null,
    },
  })

  return NextResponse.json({ success: true, data: newProduct }, { status: 201 })
}
