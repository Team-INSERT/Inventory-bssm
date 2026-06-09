import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { bridgeLocationToRoom } from "@/lib/map-location-bridge"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      productName: true,
      category: true,
      specification: true,
      productNumber: true,
      quantity: true,
      acquisitionDate: true,
      storageLocation: true,
      photoUrl: true,
      status: true,
    },
  })

  const roomMap = new Map<
    string,
    {
      count: number
      items: Array<{
        id: string
        name: string
        category: string
        specification: string | null
        productNumber: string
        quantity: number
        acquisitionDate: string
        storageLocation: string
        photoUrl: string | null
        status: string
      }>
    }
  >()

  for (const product of products) {
    const roomName = bridgeLocationToRoom(product.storageLocation)
    if (!roomName) continue

    const item = {
      id: String(product.id),
      name: product.productName,
      category: product.category,
      specification: product.specification,
      productNumber: product.productNumber,
      quantity: product.quantity,
      acquisitionDate: product.acquisitionDate.toISOString(),
      storageLocation: product.storageLocation,
      photoUrl: product.photoUrl,
      status: product.status,
    }

    const entry = roomMap.get(roomName)
    if (entry) {
      entry.count += 1
      entry.items.push(item)
    } else {
      roomMap.set(roomName, {
        count: 1,
        items: [item],
      })
    }
  }

  const rooms = Array.from(roomMap.entries())
    .map(([roomName, data]) => ({
      roomName,
      count: data.count,
      items: data.items,
    }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName))

  return NextResponse.json({ rooms })
}
