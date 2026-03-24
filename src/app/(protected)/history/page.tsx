import { createClient } from '@/shared/api/supabase/server'
import { format } from 'date-fns'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: txs } = await supabase
    .from('transactions')
    .select(`
      id, quantity, type, reason, created_at,
      items(name, category),
      from_warehouse:warehouses!transactions_from_warehouse_id_fkey(name),
      to_warehouse:warehouses!transactions_to_warehouse_id_fkey(name)
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <div className="px-4 flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">나의 대여 기록</h1>
        <p className="text-gray-500 font-medium">
          본인이 사용(출고)하거나 입고한 재고 이력을 확인합니다.
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-black/5 rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 uppercase font-bold tracking-widest text-[10px]">
            <tr>
              <th className="px-6 py-4">물품명</th>
              <th className="px-6 py-4">유형</th>
              <th className="px-6 py-4">수량</th>
              <th className="px-6 py-4">창고 / 사유</th>
              <th className="px-6 py-4">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-zinc-800">
            {!txs || txs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium font-medium">대여 현황이 없습니다.</td>
              </tr>
            ) : (
              txs.map((tx: any) => {
                const fromWH = tx.from_warehouse?.name
                const toWH = tx.to_warehouse?.name
                
                let details = ''
                if (tx.type === 'TRANSFER') details = `${fromWH} ➝ ${toWH}`
                else if (tx.type === 'OUT') details = `출발지: ${fromWH || '알 수 없음'}`
                else if (tx.type === 'IN') details = `도착지: ${toWH || '알 수 없음'}`
                
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {tx.items?.name} <span className="text-xs text-gray-400 ml-1 font-medium italic">({tx.items?.category})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        tx.type === 'OUT' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                        tx.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-lg tabular-nums">{tx.quantity}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 mb-1">{details}</span>
                        {tx.reason && <span className="text-gray-900 dark:text-zinc-300">{tx.reason}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-bold text-xs">
                      {format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 px-4">
        {!txs || txs.length === 0 ? (
          <div className="py-20 text-center text-gray-500 font-medium border-2 border-black/10 border-dashed rounded-3xl dark:border-zinc-800">
            대여 현황이 없습니다.
          </div>
        ) : (
          txs.map((tx: any) => {
            const fromWH = tx.from_warehouse?.name
            const toWH = tx.to_warehouse?.name
            
            let details = ''
            if (tx.type === 'TRANSFER') details = `${fromWH} ➝ ${toWH}`
            else if (tx.type === 'OUT') details = `출발지: ${fromWH || '알 수 없음'}`
            else if (tx.type === 'IN') details = `도착지: ${toWH || '알 수 없음'}`

            return (
              <div key={tx.id} className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white tracking-tight text-lg">{tx.items?.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{tx.items?.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    tx.type === 'OUT' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                    tx.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}>
                    {tx.type}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4 border-y border-black/5 dark:border-zinc-800/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">변동 수량</span>
                    <span className="font-black text-2xl tabular-nums">{tx.quantity} <span className="text-sm font-medium text-gray-400 ml-0.5">개</span></span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">상세 내역</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{details}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">처리 사유</span>
                    <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">{tx.reason || '사유 없음'}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">처리 일시</span>
                     <span className="text-xs font-bold text-gray-400">
                        {format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}
                     </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
