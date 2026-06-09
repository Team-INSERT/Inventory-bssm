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

const createUserSchema = z.object({
  pin: pinSchema,
  name: z.string().min(1).max(50),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
})

const userSelect = {
  id: true,
  pin: true,
  name: true,
  role: true,
  email: true,
  isActive: true,
  createdAt: true,
}

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

function requiresAdminCredentials(role: string, email?: string | null, password?: string | null) {
  return role === "ADMIN" && (!email || !password)
}

function isDuplicatePinError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: userSelect,
  })

  return NextResponse.json({ success: true, data: users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { pin, name, role, email, password } = parsed.data

  if (requiresAdminCredentials(role, email, password)) {
    return NextResponse.json(
      {
        error: "ADMIN_CREDENTIALS_REQUIRED",
        message: "ADMIN 생성에는 이메일과 비밀번호가 필요합니다."
      },
      { status: 422 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { pin } })
  if (existing) {
    return NextResponse.json(
      { error: "DUPLICATE_PIN", message: "이미 사용 중인 PIN 번호입니다." },
      { status: 409 },
    )
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null

  try {
    const newUser = await prisma.user.create({
      data: {
        pin,
        name,
        role,
        email: email || null,
        password: hashedPassword,
      },
      select: userSelect,
    })

    return NextResponse.json({ success: true, data: newUser }, { status: 201 })
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
