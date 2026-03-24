import { redirect } from 'next/navigation'
import { createClient } from '@/shared/api/supabase/server'
import Navbar from '@/widgets/navbar/ui/navbar'
import PageTransition from '@/shared/ui/page-transition'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Protect all routes except /login and /auth/callback
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-8">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  )
}
