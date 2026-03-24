'use server'

import { createClient } from '@/shared/api/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWarehouse(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  const { error } = await supabase.from('warehouses').insert({ name })

  if (!error) {
    revalidatePath('/admin/warehouses')
    revalidatePath('/admin')
  }
  
  return { error: error?.message }
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('warehouses').delete().eq('id', id)
  
  if (!error) {
    revalidatePath('/admin/warehouses')
    revalidatePath('/admin')
  }
}
