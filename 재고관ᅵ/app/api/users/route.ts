import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const createUserSchema = z.object({
  pin: z.string().min(4).max(6).regex(/^\d+$/, "PIN은 4~6자리 숫자"),
  name: z.string().min(1).max(50),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional().nullable(),
})

function isAdmin(user: { role?: string } | undefined | null) {
  return user?.role === "ADMIN"
}

export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pin: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, data: users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

  const existing = await prisma.user.findUnique({ where: { pin } })
  if (existing) {
    return NextResponse.json(
      { error: "DUPLICATE_PIN", message: "이미 사용 중인 PIN 번호입니다." },
      { status: 409 },
    )
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null

  const newUser = await prisma.user.create({
    data: {
      pin,
      name,
      role,
      email: email || null,
      password: hashedPassword,
    },
    select: {
      id: true,
      pin: true,
      name: true,
      role: true,
      email: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, data: newUser }, { status: 201 })
}
