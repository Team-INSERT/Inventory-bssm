import InventoryGrid from "@/widgets/inventory-overview/ui/inventory-grid";
import { PackageSearch, ShoppingBag, ArrowDownToLine } from "lucide-react";
import * as motion from "framer-motion/client";
import { getSupabaseAdminClient } from "@/shared/api/supabase/server";

export default async function CheckoutPage() {
  const supabase = await getSupabaseAdminClient();

  const { data: items } = await supabase.from("items").select("*");
  const { data: warehouses } = await supabase.from("warehouses").select("*");
  const { data: inventory } = await supabase.from("inventory").select("*");

  const isAdmin = true;

  // Flat data for grid consumption (only items with stock)
  const flatData = [];
  if (items && warehouses && inventory) {
    for (const item of items) {
      for (const warehouse of warehouses) {
        const invRecord = inventory.find(
          (i: any) => i.item_id === item.id && i.warehouse_id === warehouse.id,
        );
        if (invRecord && invRecord.quantity > 0) {
          flatData.push({
            item_id: item.id,
            warehouse_id: warehouse.id,
            quantity: invRecord.quantity,
            item_name: item.name,
            item_category: item.category,
            item_min: item.min_stock,
            warehouse_name: warehouse.name,
            image_url: item.image_url,
            has_serial_number: item.has_serial_number,
          });
        }
      }
    }
  }

  return (
    <div className="">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl text-white shadow-xl shadow-blue-900/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                자산 반출 및 불출
              </h1>
            </div>
            <p className="text-blue-100 font-medium max-w-xl text-sm sm:text-base leading-relaxed">
              부서원에게 자산을 지급하거나 일시적으로 반출할 수 있습니다. 수량이
              충분한 품목만 목록에 표시됩니다.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
                출고 가능한 품목 수
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black tabular-nums tracking-tighter">
                  {flatData.length}
                </span>
                <span className="text-sm font-medium text-blue-200">종류</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowDownToLine className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {flatData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 px-4 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 shadow-sm"
        >
          <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <PackageSearch className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            출고 가능한 자산이 없습니다
          </h3>
          <p className="text-gray-500 font-medium max-w-md leading-relaxed text-sm">
            현재 모든 창고의 재고가 소진되었거나, 등록된 물품이 없습니다.
            관리자에게 문의하여 재고를 보충해주세요.
          </p>
        </motion.div>
      ) : (
        <InventoryGrid
          initialData={flatData}
          warehouses={warehouses || []}
          isAdmin={isAdmin}
          hideWarehouseFilter={false}
        />
      )}
    </div>
  );
}
