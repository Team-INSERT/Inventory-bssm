import { createClient } from '@/shared/api/supabase/server'
import { Package, Users, ArrowRightLeft, Clock, MapPin, Search } from 'lucide-react'
import { format } from 'date-fns'
import * as motion from 'framer-motion/client'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch summary data
  const { data: inventory } = await supabase
    .from('inventory_view')
    .select('*')
  
  const { data: recentTxs } = await supabase
    .from('transactions')
    .select(`
      id, quantity, type, reason, created_at,
      items(name),
      users(full_name, email),
      from_warehouse:warehouses!transactions_from_warehouse_id_fkey(name),
      to_warehouse:warehouses!transactions_to_warehouse_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: warehouses } = await supabase.from('warehouses').select('*')

  const totalItems = inventory?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0
  const lowStockItems = inventory?.filter((item: any) => item.quantity <= item.item_min).length || 0

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 space-y-8 pb-32 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white">관리자 대시보드</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">시스템 전체 재고 및 사용자 활동을 실시간 모니터링합니다.</p>
        </div>
        <div className="flex items-center gap-2 self-start px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-nowrap">시스템 정상 가동 중</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-0">
        {[
          { label: '전체 재고량', value: `${totalItems}개`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '부족 품목', value: `${lowStockItems}종`, icon: Search, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: '활성 사용자', value: '전체', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: '운영 창고', value: `${warehouses?.length || 0}곳`, icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 shadow-sm transition-all hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className={stat.bg + " w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 " + stat.color}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 px-4 sm:px-0">
        {/* Transaction Feed */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              최근 활동 로그
            </h2>
            <button className="text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">전체 보기</button>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] sm:rounded-[2.5rem] border border-black/5 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-black/5 dark:divide-zinc-800">
              {recentTxs?.map((tx: any, idx: number) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className={`p-3 shrink-0 rounded-2xl h-fit ${
                        tx.type === 'OUT' ? 'bg-orange-500/10 text-orange-600' :
                        tx.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        <ArrowRightLeft className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white leading-snug">
                          <span className="text-blue-500 break-all shrink">@{tx.users?.full_name || tx.users?.email.split('@')[0]}</span> 님이 
                          <span className="mx-1 font-extrabold text-indigo-600 dark:text-indigo-400">{tx.items?.name}</span> {tx.quantity}개를 
                          {tx.type === 'OUT' ? ' 수령했습니다.' : tx.type === 'IN' ? ' 반납했습니다.' : ' 이동했습니다.'}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed bg-gray-50 dark:bg-zinc-950 px-3 py-2 rounded-xl italic">
                          "{tx.reason || '사유가 입력되지 않았습니다.'}"
                        </p>
                        <div className="flex items-center gap-2 mt-2 sm:hidden">
                           <Clock className="w-3 h-3 text-gray-400" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             {format(new Date(tx.created_at), 'MM/dd HH:mm')}
                           </span>
                        </div>
                      </div>
                    </div>
                    <span className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-50 dark:bg-zinc-950 px-2 py-1 rounded-md">
                       {format(new Date(tx.created_at), 'MM/dd HH:mm')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Inventory Summary by Warehouse */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-black tracking-tight px-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            창고별 재고 분포
          </h2>
          <div className="space-y-4">
            {warehouses?.map((wh: any, idx: number) => {
              const whItems = inventory?.filter((inv: any) => inv.warehouse_id === wh.id)
              const count = whItems?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0
              const uniqueItems = whItems?.length || 0

              return (
                <motion.div 
                  key={wh.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 shadow-sm group hover:border-blue-500/50 transition-all"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">{wh.name}</h3>
                    <span className="text-xs font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">{uniqueItems}종 보유</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((count / totalItems) * 100, 100)}%` }}
                      transition={{ delay: 1, duration: 1.5, ease: "circOut" }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>전체 비중</span>
                    <span>{count} 개</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
