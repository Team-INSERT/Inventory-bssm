import { login, signup } from '@/features/auth/api/actions'
import { AlertCircle } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const error = (await searchParams).error

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <div className="text-center gap-2 flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            재고 관리 시스템
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            계정에 로그인하여 계속하세요.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                이메일
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              formAction={login}
              className="flex w-full justify-center rounded-lg border border-transparent bg-blue-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              로그인
            </button>
            <button
              formAction={signup}
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              회원가입
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 dark:bg-zinc-900 dark:text-gray-400">테스트용 빠른 로그인</span>
          </div>
        </div>

        <form className="flex flex-col gap-3">
          <button
            formAction={async () => {
              'use server'
              const fd = new FormData()
              fd.append('email', 'admin@bsm.hs.kr')
              fd.append('password', 'admin1234!')
              fd.append('role', 'admin') // Hint to intercept in action
              await login(fd)
            }}
            className="flex w-full justify-center rounded-lg border border-indigo-600 bg-indigo-50 py-2.5 px-4 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
          >
            👨‍🔧 관리자 계정으로 접속
          </button>
          
          <button
            formAction={async () => {
              'use server'
              const fd = new FormData()
              fd.append('email', 'user@bsm.hs.kr')
              fd.append('password', 'user1234!')
              fd.append('role', 'user')
              await login(fd)
            }}
            className="flex w-full justify-center rounded-lg border border-emerald-600 bg-emerald-50 py-2.5 px-4 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
          >
            🧑‍🎓 일반 사용자 계정으로 접속
          </button>
        </form>
      </div>
    </div>
  )
}
