import { createClient } from '@/shared/api/supabase/server'
import { ArrowRightLeft } from 'lucide-react'
import * as motion from 'framer-motion/client'
import ClientTransferForm from '../../transfer/client-transfer-form'

export default async function AdminTransferPage() {
  const supabase = await createClient()
  
  const [{ data: items }, { data: warehouses }] = await Promise.all([
    supabase.from('items').select('*'),
    supabase.from('warehouses').select('*')
  ])

  return (
    <div className="max-w-4xl mx-auto py-8 mb-24 md:mb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center px-4"
      >
        <div className="inline-flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
          <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest px-2">관리자 물류 제어</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-3">전체 창고 재고 이동</h1>
        <p className="text-gray-500 font-medium">관리자 전용 모드로 모든 창고 간의 정합성을 유지하며 재고를 이동합니다.</p>
      </motion.div>

      <div className="px-4">
        <ClientTransferForm items={items || []} warehouses={warehouses || []} />
      </div>
    </div>
  )
}
