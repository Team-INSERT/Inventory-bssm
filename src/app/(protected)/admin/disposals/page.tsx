import { createClient } from '@/shared/api/supabase/server'
import { Trash2, History, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default async function DisposalsPage() {
  const supabase = await createClient()

  // Fetch transactions with type 'DISPOSE' or similar if we implement it.
  // For now, let's look for transactions where the reason contains '폐기' 
  // or add a new transaction type in the future. 
  // The user asked for: 폐기목록(누가 폐기했는지, 언제했는지)
  const { data: disposals } = await supabase
    .from('transactions')
    .select(`
      id, quantity, reason, created_at,
      items(name),
      users(full_name, email)
    `)
    .or('reason.ilike.%폐기%,type.eq.DISPOSE')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 pb-20">
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">폐기 품목 관리</h1>
        <p className="text-gray-500 font-medium tracking-tight">수명 주기 만료 또는 파손으로 처리된 폐기 자산 이력입니다.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-400 dark:bg-zinc-800/50 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">폐기 품목</th>
                <th className="px-6 py-4 text-center">처리 상태</th>
                <th className="px-6 py-4">담당자</th>
                <th className="px-6 py-4">처리 일시</th>
                <th className="px-6 py-4">폐기 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {!disposals || disposals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                     <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                     기록된 폐기 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                disposals.map((dis: any) => (
                  <tr key={dis.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-5 font-bold text-gray-900 dark:text-white">
                      {dis.items?.name}
                    </td>
                    <td className="px-6 py-5 text-center font-black text-red-500 uppercase tracking-tighter text-[10px]">
                      모든 재고 폐기됨
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                           <User className="w-3 h-3 text-gray-400" />
                         </div>
                         <span className="font-semibold">{dis.users?.full_name || dis.users?.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(dis.created_at), 'yyyy/MM/dd HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold">
                        {dis.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
