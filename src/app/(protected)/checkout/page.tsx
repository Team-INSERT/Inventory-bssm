import { createClient } from '@/shared/api/supabase/server'
import InventoryGrid from '@/widgets/inventory-overview/ui/inventory-grid'
import { PackageSearch, ShoppingBag, ArrowDownToLine } from 'lucide-react'
import * as motion from 'framer-motion/client'

export default async function CheckoutPage() {
  const supabase = await createClient()

  // Fetch items, warehouses, and inventory
  const [
    { data: items },
    { data: warehouses },
    { data: inventory }
  ] = await Promise.all([
    supabase.from('items').select('*'),
    supabase.from('warehouses').select('*'),
    supabase.from('inventory').select('*')
  ])

  // Flat data for grid consumption (only items with stock)
  const flatData = []
  if (items && warehouses) {
    for (const item of items) {
      for (const warehouse of warehouses) {
        const invRecord = inventory?.find((i: any) => i.item_id === item.id && i.warehouse_id === warehouse.id)
        if (invRecord && invRecord.quantity > 0) {
          flatData.push({
            item_id: item.id,
            warehouse_id: warehouse.id,
            quantity: invRecord.quantity,
            item_name: item.name,
            item_category: item.category,
            item_min: item.min_stock,
            warehouse_name: warehouse.name
          })
        }
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('role').eq('id', user?.id).single()
  const isAdmin = userData?.role === 'admin'

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">물품 사용 및 수령</h1>
            <p className="text-gray-500 font-medium mt-1">사용 가능한 물품을 검색하고 즉시 수령 절차를 진행하세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-6 glass glass-dark rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">1단계</p>
              <p className="text-sm font-bold">물품 검색 및 선택</p>
            </div>
          </div>
          <div className="p-6 glass glass-dark rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">2단계</p>
              <p className="text-sm font-bold">수량 및 사유 입력</p>
            </div>
          </div>
          <div className="p-6 glass glass-dark rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">3단계</p>
              <p className="text-sm font-bold">수령 완료 및 기록</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <InventoryGrid 
          initialData={flatData} 
          warehouses={warehouses || []} 
          isAdmin={isAdmin} 
        />
      </motion.div>
    </div>
  )
}
