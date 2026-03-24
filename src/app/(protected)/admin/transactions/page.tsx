import { createClient } from "@/shared/api/supabase/server";
import { format } from "date-fns";
import { StockInOutButtons } from "./stock-in-out-buttons";

async function getInitialData() {
  const supabase = await createClient();
  const { data: txs } = await supabase
    .from("transactions")
    .select(
      `
      id, quantity, type, reason, created_at,
      items(name, category),
      users(full_name, email),
      from_warehouse:warehouses!transactions_from_warehouse_id_fkey(name),
      to_warehouse:warehouses!transactions_to_warehouse_id_fkey(name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: items } = await supabase
    .from("items")
    .select(
      `
      id, name, category,
      inventory (
        warehouse_id,
        quantity,
        warehouses (id, name)
      )
    `,
    )
    .order("name", { ascending: true });

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name", { ascending: true });

  return { txs, items, warehouses };
}

export default async function AdminTransactionsPage() {
  const { txs, items, warehouses } = await getInitialData();

  return (
    <div className="space-y-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">
          이력 관리 (Log)
        </h1>
        <p className="text-gray-500 font-medium tracking-tight">
          시스템 전체 재고 및 이동의 상세 생애주기를 확인하고, 수동으로
          입/출고를 진행할 수 있습니다.
        </p>
      </div>

      <StockInOutButtons items={items || []} warehouses={warehouses || []} />

      <div className="border border-black/5 rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden mx-4 sm:mx-0">
        <h3 className="text-lg font-black p-6 tracking-tight border-b border-gray-50 dark:border-zinc-800">최근 이력</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">물품명</th>
              <th className="px-4 py-3">유형/수량</th>
              <th className="px-4 py-3">사용자</th>
              <th className="px-4 py-3">창고 / 사유</th>
              <th className="px-4 py-3">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-zinc-800">
            {!txs || txs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  트랜잭션 이력이 없습니다.
                </td>
              </tr>
            ) : (
              txs.map((tx: any) => {
                // @ts-ignore
                const fromWH = tx.from_warehouse?.name;
                // @ts-ignore
                const toWH = tx.to_warehouse?.name;
                // @ts-ignore
                const userName =
                  tx.users?.full_name ||
                  tx.users?.email?.split("@")[0] ||
                  "알 수 없음";

                let details = "";
                if (tx.type === "TRANSFER") details = `${fromWH} ➝ ${toWH}`;
                else if (tx.type === "OUT")
                  details = `출발지: ${fromWH || "알 수 없음"}`;
                else if (tx.type === "IN")
                  details = `도착지: ${toWH || "알 수 없음"}`;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {/* @ts-ignore */}
                      {tx.items?.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                          tx.type === "OUT"
                            ? "bg-orange-100 text-orange-700"
                            : tx.type === "IN"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-bold">{tx.quantity}개</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {userName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex flex-col">
                        <span className="text-xs">{details}</span>
                        {tx.reason && (
                          <span
                            className="text-gray-900 dark:text-gray-300 truncate max-w-[200px]"
                            title={tx.reason}
                          >
                            {tx.reason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(tx.created_at), "yyyy.MM.dd HH:mm")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
