'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ShoppingBag, History, ArrowRightLeft, LayoutDashboard } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/', icon: Search, label: '재고/수령' },
    { href: '/history', icon: History, label: '기록' },
    { href: '/transfer', icon: ArrowRightLeft, label: '이동' },
  ]

  if (isAdmin) {
    tabs.push({ href: '/admin', icon: LayoutDashboard, label: '관리' })
  }

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <nav className="flex items-center justify-around bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-zinc-800/50 rounded-3xl h-18 px-4 shadow-2xl shadow-blue-500/10">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <div className="relative flex flex-col items-center justify-center py-2 h-14">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/20 rounded-2xl -z-10 shadow-inner"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-blue-500/5 dark:bg-blue-400/10 blur-xl rounded-full -z-20 invisible dark:visible"
                  />
                )}
                <tab.icon className={cn(
                  "w-5 h-5 transition-all duration-500",
                  isActive ? "text-blue-600 dark:text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" : "text-gray-400"
                )} />
                <span className={cn(
                  "text-[10px] font-black mt-1.5 tracking-tighter transition-colors duration-500 uppercase",
                  isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-400"
                )}>
                  {tab.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
