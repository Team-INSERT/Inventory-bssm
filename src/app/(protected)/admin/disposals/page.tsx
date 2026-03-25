import { getSupabaseAdminClient } from "@/shared/api/supabase/server";
import { Trash2, History, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DisposalsPage() {
  const supabase = await getSupabaseAdminClient();

  // Fetch transactions with type 'DISPOSE' or similar if we implement it.
  // For now, let's look for transactions where the reason contains '폐기'
  // or add a new transaction type in the future.
  // The user asked for: 폐기목록(누가 폐기했는지, 언제했는지)
  const { data: disposals } = await supabase
    .from("transactions")
    .select(
      `
      id, quantity, reason, created_at,
      items(name),
      users(full_name, email)
    `,
    )
    .or("reason.ilike.%폐기%,type.eq.DISPOSE")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-1 sm:mb-2">
          폐기 품목 관리
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-tight">
          수명 주기 만료 또는 파손으로 처리된 폐기 자산 이력입니다.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-400 dark:bg-zinc-800/50 uppercase font-black text-[9px] sm:text-[10px] tracking-widest">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4">폐기 품목</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                  처리 상태
                </th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">담당자</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">처리 일시</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">폐기 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {!disposals || disposals.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 sm:px-6 py-16 sm:py-20 text-center text-gray-400\"
                  >
                    <History className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-10" />
                    기록된 폐기 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                disposals.map((dis: any) => (
                  <tr
                    key={dis.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors\"
                  >
                    <td className="px-3 sm:px-6 py-4 sm:py-5 font-bold text-gray-900 dark:text-white text-xs sm:text-sm\">
                      {dis.items?.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-5 text-center font-black text-red-500 uppercase tracking-tighter text-[9px] sm:text-[10px]\">
                      모든 재고 폐기됨
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-5\">
                      <div className="flex items-center gap-2\">
                        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center\">
                          <User className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-gray-400\" />
                        </div>
                        <span className="font-semibold text-xs sm:text-sm\">
                          {dis.users?.full_name ||
                            dis.users?.email.split("@")[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-5 text-gray-500 font-medium text-xs sm:text-sm\">
                      <div className="flex items-center gap-2\">
                        <Calendar className="w-3 h-3\" />
                        {format(new Date(dis.created_at), "yyyy/MM/dd HH:mm")}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 sm:py-5\">
                      <span className="px-2 sm:px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] sm:text-xs font-bold\">
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
  );
}
