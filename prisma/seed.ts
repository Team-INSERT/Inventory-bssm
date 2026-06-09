import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("시드 데이터 생성 시작...")

  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { pin: "0000" },
    update: {},
    create: {
      pin: "0000",
      name: "관리자",
      role: "ADMIN",
      email: "admin@example.com",
      password: adminPassword,
      isActive: true,
    },
  })

  console.log("관리자 계정 생성 완료:", { id: admin.id, email: admin.email, role: admin.role })

  const user = await prisma.user.upsert({
    where: { pin: "1234" },
    update: {},
    create: {
      pin: "1234",
      name: "사용자",
      role: "USER",
      isActive: true,
    },
  })

  console.log("일반 사용자 계정 생성 완료:", { id: user.id, pin: user.pin, role: user.role })

  const sampleProducts = [
    {
      productNumber: "20240001-0001",
      productName: "노트북",
      category: "전자기기",
      specification: "15인치, 16GB RAM",
      quantity: 10,
      acquisitionDate: new Date("2024-01-15"),
      usefulLife: 5,
      storageLocation: "창고 A",
    },
    {
      productNumber: "20240001-0002",
      productName: "프로젝터",
      category: "전자기기",
      specification: "4K UHD",
      quantity: 5,
      acquisitionDate: new Date("2024-02-20"),
      usefulLife: 7,
      storageLocation: "창고 B",
    },
    {
      productNumber: "20240001-0003",
      productName: "화이트보드",
      category: "사무용품",
      specification: "180x90cm",
      quantity: 8,
      acquisitionDate: new Date("2024-03-10"),
      storageLocation: "창고 C",
    },
  ]

  for (const product of sampleProducts) {
    const created = await prisma.product.upsert({
      where: { productNumber: product.productNumber },
      update: product,
      create: product,
    })
    console.log("물품 생성 완료:", { id: created.id, productNumber: created.productNumber, name: created.productName })
  }

  console.log("시드 데이터 생성 완료!")
}

main()
  .catch((e) => {
    console.error("시드 데이터 생성 실패:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
