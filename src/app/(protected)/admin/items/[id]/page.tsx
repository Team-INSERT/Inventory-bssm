import { notFound } from "next/navigation";
import { SerialManagementClient } from "./serial-management-client";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSupabaseAdminClient } from "@/shared/api/supabase/server";

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  // id 02923... is string
  // @ts-ignore
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const supabase = await getSupabaseAdminClient();

  // Fetch Item
  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    notFound();
  }

  // Fetch Serials
  const { data: serials, error: serialsError } = await supabase
    .from("item_serials")
    .select("*")
    .eq("item_id", id);

  // Fetch Warehouses
  const { data: warehouses, error: warehousesError } = await supabase
    .from("warehouses")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/items"
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            {item.name}
            {item.has_serial_number && (
              <span className="px-1.5 py-px rounded-md bg-blue-100/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] uppercase tracking-wider whitespace-nowrap font-bold">
                시리얼 지원
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {item.category} • 생산: {item.production_year}년
            {item.has_service_life ? ` • 수명: ${item.service_life}년` : " • 수명: 적용 안됨"}
          </p>
        </div>
      </div>

      <SerialManagementClient 
        item={item} 
        warehouses={warehouses || []} 
        initialSerials={serials || []} 
      />
    </div>
  );
}
