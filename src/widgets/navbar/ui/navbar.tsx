import Link from 'next/link'
import { createClient } from '@/shared/api/supabase/server'
import { logout } from '@/features/auth/api/actions'
import { LogOut, PackageSearch, LayoutDashboard } from 'lucide-react'
import BottomNav from './bottom-nav'
import NavLinks from './nav-links'

import { ThemeToggle } from '@/widgets/theme-toggle'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin'
  const displayName = userData?.full_name || user.email?.split('@')[0]

  return (
    <>
      <nav className="hidden md:block border-b border-black/5 bg-white/80 backdrop-blur-xl dark:bg-zinc-950/80 dark:border-zinc-800 sticky top-0 z-[100]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <Link href="/" className="flex flex-shrink-0 items-center gap-2 font-black text-xl tracking-tighter text-blue-600 dark:text-blue-500">
                <PackageSearch className="h-7 w-7" />
                <span>재고 관리</span>
              </Link>
              <div className="ml-10 flex space-x-8">
                <NavLinks isAdmin={isAdmin} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Connected As</span>
                <span className="text-sm text-gray-900 dark:text-white font-bold">
                  {displayName}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />
              <ThemeToggle />
              <form action={logout}>
                <button className="flex items-center gap-2 rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all active:scale-95 group">
                  <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  <span className="sr-only">로그아웃</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex h-16 items-center justify-between px-6 bg-white/80 backdrop-blur-xl dark:bg-zinc-950/80 border-b border-black/5 dark:border-zinc-800 sticky top-0 z-[100]">
        <div className="flex items-center gap-2 font-black text-lg tracking-tighter text-blue-600">
          <PackageSearch className="h-6 w-6" />
          <span>재고 관리</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout}>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <BottomNav isAdmin={isAdmin} />
    </>
  )
}
