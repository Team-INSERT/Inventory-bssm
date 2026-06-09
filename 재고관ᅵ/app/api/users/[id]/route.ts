import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  isActive: z.boolean().optional(),
})

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

function parseUserId(id: string) {
  const userId = Number.parseInt(id, 10)
  return Number.isNaN(userId) ? null : userId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const userId = parseUserId(params.id)
  if (userId === null) {
    return NextResponse.json({ error: "INVALID_USER_ID" }, { status: 400 })
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      pin: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!foundUser) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: foundUser })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  const currentUser = session?.user as { role?: string } | undefined

  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const userId = parseUserId(params.id)
  if (userId === null) {
    return NextResponse.json({ error: "INVALID_USER_ID" }, { status: 400 })
  }

  const body = await req.json()
  const parsed = updateUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
  }

  const demotingAdmin =
    targetUser.role === "ADMIN" &&
    (parsed.data.role === "USER" || parsed.data.isActive === false)

  if (demotingAdmin) {
    const activeAdminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    })

    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { error: "LAST_ADMIN", message: "최소 1명의 관리자가 필요합니다." },
        { status: 422 },
      )
    }
  }

  const { password, ...rest } = parsed.data
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    },
    select: {
      id: true,
      pin: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  const currentUser = session?.user as { role?: string } | undefined

  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const userId = parseUserId(params.id)
  if (userId === null) {
    return NextResponse.json({ error: "INVALID_USER_ID" }, { status: 400 })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  })

  if (!targetUser) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
  }

  if (targetUser.role === "ADMIN" && targetUser.isActive) {
    const activeAdminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    })

    if (activeAdminCount <= 1) {
      return NextResponse.json(
        { error: "LAST_ADMIN", message: "최소 1명의 관리자가 필요합니다." },
        { status: 422 },
      )
    }
  }

  const deactivated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      pin: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ success: true, data: deactivated })
}
