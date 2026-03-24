'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/shared/api/supabase/server'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const email = formData.get('email') as string
  const role = formData.get('role') as string || (email.includes('admin') ? 'admin' : 'user')

  // Just set a mock cookie for testing
  cookieStore.set('mock_role', role)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  // Signup also just logs in for mock mode
  return login(formData)
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('mock_role')
  redirect('/login')
}
