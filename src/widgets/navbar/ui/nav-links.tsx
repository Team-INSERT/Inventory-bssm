'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '재고 및 수령' },
    { href: '/history', label: '대여 기록' },
    { href: '/transfer', label: '창고 이동' },
  ]

  return (
    <div className="flex space-x-8">
      {links.map((link) => {
        const isActive = pathname === link.href
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative inline-flex items-center px-1 pt-1 text-sm font-black transition-all duration-300 h-16",
              isActive 
                ? "text-blue-600 dark:text-blue-500" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            {link.label}
            {isActive && (
              <motion.div
                layoutId="navIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full shadow-lg shadow-blue-500/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        )
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "relative inline-flex items-center gap-1 px-1 pt-1 text-sm font-black transition-all duration-300 h-16",
            pathname === '/admin'
              ? "text-orange-600 dark:text-orange-500"
              : "text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          관리 대시보드
          {pathname === '/admin' && (
            <motion.div
              layoutId="navIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 dark:bg-orange-500 rounded-t-full shadow-lg shadow-orange-500/50"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </Link>
      )}
    </div>
  )
}
