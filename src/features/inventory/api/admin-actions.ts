'use server'

import { createClient } from '@/shared/api/supabase/server'

export async function getLowStockItems() {
  const supabase = await createClient()

  // 1. Fetch all items
  const { data: items } = await supabase.from('items').select('id, name, min_stock, category')
  if (!items) return []

  // 2. Fetch all inventory grouped by item_id
  const { data: inventory } = await supabase.from('inventory').select('item_id, quantity')
  
  // 3. Aggregate global quantities
  const itemQuantities: Record<string, number> = {}
  inventory?.forEach((inv: any) => {
    itemQuantities[inv.item_id] = (itemQuantities[inv.item_id] || 0) + inv.quantity
  })

  // 4. Filter items where total quantity <= min_stock
  const lowStock = items.filter((item: any) => {
    const total = itemQuantities[item.id] || 0
    return total <= item.min_stock
  }).map((item: any) => ({
    ...item,
    current_stock: itemQuantities[item.id] || 0
  }))

  return lowStock
}
