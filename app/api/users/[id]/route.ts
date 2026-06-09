import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4,6}$/, "PIN은 4~6자리 숫자")

const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
  isActive: z.boolean().optional(),
  pin: pinSchema.optional(),
})

const userSelect = {
  id: true,
  pin: true,
  name: true,
  role: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

function parseUserId(id: string) {
  const userId = Number.parseInt(id, 10)
  return Number.isNaN(userId) ? null : userId
}

function requiresAdminCredentials(role?: string, email?: string | null, password?: string | null) {
  return role === "ADMIN" && (!email || !password)
}

function isDuplicatePinError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function buildUpdatedEmail(
  targetUser: { role: string; email: string | null },
  nextEmail?: string | null,
) {
  if (nextEmail !== undefined) return nextEmail
  return targetUser.role === "ADMIN" ? targetUser.email : undefined
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id } = await params
  const userId = parseUserId(id)
  if (userId === null) {
    return NextResponse.json({ error: "INVALID_USER_ID" }, { status: 400 })
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!foundUser) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: foundUser })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const currentUser = session?.user as { role?: string } | undefined

  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id } = await params
  const userId = parseUserId(id)
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

  if (targetUser.role === "ADMIN" && parsed.data.email === null) {
    return NextResponse.json(
      {
        error: "ADMIN_CREDENTIALS_REQUIRED",
        message: "기존 ADMIN 계정의 이메일은 비울 수 없습니다.",
      },
      { status: 422 },
    )
  }

  if (parsed.data.role === "ADMIN") {
    if (requiresAdminCredentials(parsed.data.role, parsed.data.email, parsed.data.password)) {
      return NextResponse.json(
        {
          error: "ADMIN_CREDENTIALS_REQUIRED",
          message: "ADMIN 전환에는 이메일과 비밀번호가 필요합니다.",
        },
        { status: 422 },
      )
    }
  }

  if (parsed.data.pin) {
    const duplicatePin = await prisma.user.findFirst({
      where: {
        pin: parsed.data.pin,
        NOT: { id: userId },
      },
      select: { id: true },
    })

    if (duplicatePin) {
      return NextResponse.json(
        { error: "DUPLICATE_PIN", message: "이미 사용 중인 PIN 번호입니다." },
        { status: 409 },
      )
    }
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

  const { password, pin, email, ...rest } = parsed.data
  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined
  const updatedEmail = buildUpdatedEmail(targetUser, email)

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...rest,
        ...(pin ? { pin } : {}),
        ...(updatedEmail !== undefined ? { email: updatedEmail } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      select: userSelect,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (isDuplicatePinError(error)) {
      return NextResponse.json(
        { error: "DUPLICATE_PIN", message: "이미 사용 중인 PIN 번호입니다." },
        { status: 409 },
      )
    }

    throw error
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const currentUser = session?.user as { role?: string } | undefined

  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const { id } = await params
  const userId = parseUserId(id)
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
    select: userSelect,
  })

  return NextResponse.json({ success: true, data: deactivated })
}
