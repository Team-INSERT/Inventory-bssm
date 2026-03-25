import { Suspense } from "react";
import { getSupabaseAdminClient, createClient } from "@/shared/api/supabase/server";
import InventoryLayout from "./inventory-layout";

export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = await getSupabaseAdminClient();

  // Verify role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id)
    .single();
  const isAdmin = userData?.role === "admin";

  // Fetch items, warehouses, and inventory
  const [{ data: items }, { data: warehouses }, { data: inventory }] =
    await Promise.all([
      adminSupabase.from("items").select("*"),
      adminSupabase.from("warehouses").select("*"),
      adminSupabase.from("inventory").select("*"),
    ]);

  // Flat data for grid consumption
  const flatData = [];

  if (items && warehouses) {
    for (const item of items) {
      for (const warehouse of warehouses) {
        const invRecord = inventory?.find(
          (i: any) => i.item_id === item.id && i.warehouse_id === warehouse.id,
        );
        if (invRecord) {
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
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          재고 지도 뷰 및 현황
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          지도에서 창고 구역을 클릭하여 내부 물품을 확인하거나 개수를 조정할 수
          있습니다.
        </p>
      </div>

      <InventoryLayout
        initialData={flatData}
        warehouses={warehouses || []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
