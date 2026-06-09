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

function parseProductId(id: string) {
  const productId = Number.parseInt(id, 10)
  return Number.isNaN(productId) ? null : productId
}

const updateProductSchema = z
  .object({
    productNumber: z
      .string()
      .regex(/^\d{8}-\d{8}$/, "물품번호 형식이 올바르지 않습니다. (예: 20240001-0001)")
      .optional(),
    productName: z.string().min(1, "물품명을 입력하세요.").max(100).optional(),
    category: z.string().min(1, "분류를 입력하세요.").max(50).optional(),
    specification: z.string().max(200).optional().nullable(),
    quantity: z.number().int().min(0, "수량은 0 이상이어야 합니다.").optional(),
    acquisitionDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "유효한 날짜 형식이 아닙니다.",
      })
      .optional(),
    usefulLife: z.number().int().min(0).optional().nullable(),
    storageLocation: z.string().min(1, "보관 위치를 입력하세요.").max(100).optional(),
    photoUrl: photoUrlSchema,
    notes: z.string().max(500).optional().nullable(),
  })
  .strict()

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

export async function GET(
  _req: NextRequest,
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

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: product })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  if (!isAdmin(user)) {
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
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: { formErrors: ["유효하지 않은 요청 본문입니다."], fieldErrors: {} } },
      { status: 400 },
    )
  }

  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: { formErrors: ["수정할 항목을 입력하세요."], fieldErrors: {} } },
      { status: 400 },
    )
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!existing) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 })
  }

  if (data.productNumber !== undefined) {
    const duplicate = await prisma.product.findFirst({
      where: {
        productNumber: data.productNumber,
        NOT: { id: productId },
      },
      select: { id: true },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: "DUPLICATE_PRODUCT_NUMBER", message: "이미 사용 중인 물품번호입니다." },
        { status: 409 },
      )
    }
  }

  const updateData: Prisma.ProductUpdateInput = {}

  if (data.productNumber !== undefined) {
    updateData.productNumber = data.productNumber
  }

  if (data.productName !== undefined) {
    updateData.productName = data.productName
  }

  if (data.category !== undefined) {
    updateData.category = data.category
  }

  if (data.specification !== undefined) {
    updateData.specification = data.specification || null
  }

  if (data.quantity !== undefined) {
    updateData.quantity = data.quantity
  }

  if (data.acquisitionDate !== undefined) {
    updateData.acquisitionDate = new Date(data.acquisitionDate)
  }

  if (data.usefulLife !== undefined) {
    updateData.usefulLife = data.usefulLife
  }

  if (data.storageLocation !== undefined) {
    updateData.storageLocation = data.storageLocation
  }

  if (data.photoUrl !== undefined) {
    updateData.photoUrl = data.photoUrl || null
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes || null
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  })

  return NextResponse.json({ success: true, data: updatedProduct })
}
