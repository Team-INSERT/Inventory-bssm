"use client";

import { useState } from "react";
import { createClient } from "@/shared/api/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Item = {
  id: string;
  name: string;
  category: string;
  inventory: {
    warehouse_id: string;
    quantity: number;
    warehouses: {
      id: string;
      name: string;
    };
  }[];
};

export function StockInOutButtons({
  items,
  warehouses,
}: {
  items: Item[];
  warehouses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");

  const handleAction = async (type: "IN" | "OUT") => {
    if (!selectedItem || !selectedWarehouse || quantity <= 0) {
      alert("물품, 창고, 수량을 올바르게 입력해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    // 1. Find current inventory
    const { data: inventory, error: invError } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("item_id", selectedItem.id)
      .eq("warehouse_id", selectedWarehouse)
      .single();

    if (invError && invError.code !== "PGRST116") {
      // PGRST116: no rows found
      alert(`재고 조회 오류: ${invError.message}`);
      setLoading(false);
      return;
    }

    const currentQuantity = inventory?.quantity || 0;
    const newQuantity =
      type === "IN" ? currentQuantity + quantity : currentQuantity - quantity;

    if (type === "OUT" && newQuantity < 0) {
      alert("재고가 부족합니다.");
      setLoading(false);
      return;
    }

    // 2. Upsert inventory
    const { error: upsertError } = await supabase.from("inventory").upsert(
      {
        id: inventory?.id,
        item_id: selectedItem.id,
        warehouse_id: selectedWarehouse,
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_id,warehouse_id" },
    );

    if (upsertError) {
      alert(`재고 업데이트 오류: ${upsertError.message}`);
      setLoading(false);
      return;
    }

    // 3. Create transaction log
    const { error: txError } = await supabase.from("transactions").insert({
      item_id: selectedItem.id,
      [type === "IN" ? "to_warehouse_id" : "from_warehouse_id"]:
        selectedWarehouse,
      user_id: user.id,
      quantity: quantity,
      type: type,
      reason: reason || (type === "IN" ? "수동 입고" : "수동 출고"),
    });

    if (txError) {
      alert(`거래 기록 생성 오류: ${txError.message}`);
      // Rollback might be needed here in a real-world scenario
    } else {
      alert(
        `${selectedItem.name} ${quantity}개 ${type === "IN" ? "입고" : "출고"} 완료.`,
      );
      // Reset form
      setSelectedItem(null);
      setSelectedWarehouse("");
      setQuantity(1);
      setReason("");
      router.refresh();
    }

    setLoading(false);
  };

  const handleItemChange = (itemId: string) => {
    const item = items.find((i) => i.id === itemId) || null;
    setSelectedItem(item);
    setSelectedWarehouse(""); // Reset warehouse on item change
  };

  const availableWarehouses =
    selectedItem?.inventory.map((inv) => inv.warehouses) || warehouses;

  return (
    <div className="border border-black/5 rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 p-6 space-y-5 mx-4 sm:mx-0">
      <h2 className="text-lg font-bold tracking-tight">수동 입/출고</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={selectedItem?.id || ""}
          onChange={(e) => handleItemChange(e.target.value)}
          className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold"
        >
          <option value="">물품 선택</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.category})
            </option>
          ))}
        </select>
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          disabled={!selectedItem}
          className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold"
        >
          <option value="">창고 선택</option>
          {availableWarehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          min="1"
          className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold text-center"
          placeholder="수량"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold"
          placeholder="사유 (선택)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAction("IN")}
          disabled={loading || !selectedItem || !selectedWarehouse}
          className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "입고"}
        </button>
        <button
          onClick={() => handleAction("OUT")}
          disabled={loading || !selectedItem || !selectedWarehouse}
          className="w-full bg-orange-600 text-white rounded-xl py-3 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "출고"}
        </button>
      </div>
    </div>
  );
}
