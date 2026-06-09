"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, Package, Trash2, Users } from "lucide-react"

type Props = { isAdmin: boolean }

export function MobileNav({ isAdmin }: Props) {
  const pathname = usePathname()

  const linkClass = (href: string) =>
    [
      "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
      pathname?.startsWith(href) ? "text-white" : "text-slate-400 hover:text-slate-200",
    ].join(" ")

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950 md:hidden">
      <div className="flex justify-around">
        <Link href="/products" className={linkClass("/products")}>
          <Package className="h-5 w-5" />
          물품
        </Link>
        <Link href="/map" className={linkClass("/map")}>
          <Map className="h-5 w-5" />
          지도
        </Link>
        {isAdmin ? (
          <>
            <Link href="/disposed" className={linkClass("/disposed")}>
              <Trash2 className="h-5 w-5" />
              폐기
            </Link>
            <Link href="/users" className={linkClass("/users")}>
              <Users className="h-5 w-5" />
              사용자
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  )
}
