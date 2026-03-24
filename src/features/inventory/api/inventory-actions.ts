'use server'

import { createClient } from '@/shared/api/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateInventory(formData: FormData) {
  const supabase = await createClient()
  
  const item_id = formData.get('item_id') as string
  const warehouse_id = formData.get('warehouse_id') as string
  const change = parseInt(formData.get('change') as string, 10)
  const reason = formData.get('reason') as string
  const isDisposal = formData.get('is_disposal') === 'true'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Check existing inventory
  const { data: inv } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('item_id', item_id)
    .eq('warehouse_id', warehouse_id)
    .single()

  const currentQty = inv?.quantity || 0
  
  if (isDisposal) {
    // 2a. Full Disposal: Remove from inventory
    const { error: delError } = await supabase
      .from('inventory')
      .delete()
      .eq('item_id', item_id)
      .eq('warehouse_id', warehouse_id)

    if (delError) return { error: delError.message }
  } else {
    // 2b. Normal Adjustment
    const newQty = currentQty + change
    if (newQty < 0) {
      return { error: '재고가 부족합니다.' }
    }

    const { error: invError } = await supabase.from('inventory').upsert({
      item_id,
      warehouse_id,
      quantity: newQty,
      updated_at: new Date().toISOString()
    }, { onConflict: 'item_id,warehouse_id' })

    if (invError) return { error: invError.message }
  }

  // 3. Log transaction
  const txType = isDisposal ? 'DISPOSE' : (change > 0 ? 'IN' : 'OUT')
  const txQty = isDisposal ? currentQty : Math.abs(change)
  // For OUT, from_warehouse_id is set. For IN, realistically to_warehouse_id is set.
  // The schema has from_warehouse_id, to_warehouse_id.
  // We will map 'from_warehouse_id' for both single warehouse IN/OUT for simplicity, 
  // or `to_warehouse_id` for IN. Let's stick with from_warehouse_id for OUT and to_warehouse_id for IN.
  
  const txData = {
    item_id,
    user_id: user.id,
    quantity: txQty,
    type: txType,
    reason,
    from_warehouse_id: txType === 'OUT' ? warehouse_id : null,
    to_warehouse_id: txType === 'IN' ? warehouse_id : null,
  }

  await supabase.from('transactions').insert(txData)

  revalidatePath('/')
  return { success: true }
}

export async function transferInventory(formData: FormData) {
  const supabase = await createClient()
  
  const item_id = formData.get('item_id') as string
  const from_warehouse_id = formData.get('from_warehouse_id') as string
  const to_warehouse_id = formData.get('to_warehouse_id') as string
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const reason = formData.get('reason') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (from_warehouse_id === to_warehouse_id) return { error: '출발지와 도착지 창고가 같습니다.' }
  if (quantity <= 0) return { error: '수량은 1 이상이어야 합니다.' }

  // We should ideally call an RPC function. 
  // Wait, I created exactly this in the initial DB schema: process_transfer(p_item_id, p_from_wh, p_to_wh, p_quantity, p_user_id, p_reason)
  
  const { error } = await supabase.rpc('process_transfer', {
    p_item_id: item_id,
    p_from_warehouse_id: from_warehouse_id,
    p_to_warehouse_id: to_warehouse_id,
    p_quantity: quantity,
    p_user_id: user.id,
    p_reason: reason || '창고 간 그룹 이동'
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/transfer')
  revalidatePath('/')
  return { success: true }
}
