"use client";

import { useState } from "react";
import { Search, Package, ArrowRightLeft, Plus, Minus } from "lucide-react";
import { updateInventory } from "@/features/inventory/api/inventory-actions";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import PremiumSelect from "@/shared/ui/premium-select";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type InventoryItem = {
  item_id: string;
  warehouse_id: string;
  quantity: number;
  item_name: string;
  item_category: string;
  item_min: number;
  warehouse_name: string;
  image_url?: string;
};

export default function InventoryGrid({
  initialData,
  warehouses,
  isAdmin,
  hideWarehouseFilter = false,
}: {
  initialData: InventoryItem[];
  warehouses: { id: string; name: string }[];
  isAdmin: boolean;
  hideWarehouseFilter?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [adjustingItem, setAdjustingItem] = useState<{
    item_id: string;
    warehouse_id: string;
    name: string;
  } | null>(null);
  const [adjustData, setAdjustData] = useState({
    quantity: 1,
    reason: "",
    isDisposal: false,
    type: "OUT" as "IN" | "OUT",
  });

  // Filter logic
  const filtered = initialData.filter((inv: any) => {
    if (selectedWarehouse !== "all" && inv.warehouse_id !== selectedWarehouse)
      return false;
    if (
      search &&
      !inv.item_name.toLowerCase().includes(search.toLowerCase()) &&
      !inv.item_category.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleAdjust = async (
    item_id: string,
    warehouse_id: string,
    change: number,
    manualReason?: string,
    isDisposal: boolean = false,
  ) => {
    const key = `${item_id}-${warehouse_id}`;
    setLoadingIds((prev: any) => new Set([...prev, key]));

    let reason = manualReason || (change > 0 ? "단순 입고" : "단순 출고");

    // Fallback if somehow called without modal context (should not happen with new UI)
    if (!manualReason && change !== 0) {
      reason = change > 0 ? "신규 물품 입고" : "물품 사용 및 수령";
    }

    const formData = new FormData();
    formData.append("item_id", item_id);
    formData.append("warehouse_id", warehouse_id);
    formData.append(
      "change",
      (isDisposal ? -Math.abs(change) : change).toString(),
    );
    formData.append("reason", isDisposal ? `[자산폐기] ${reason}` : reason);
    formData.append("is_disposal", isDisposal.toString());

    const result = await updateInventory(formData);
    if (result.error) {
      alert(result.error);
    }

    setLoadingIds((prev: any) => {
      const next = new Set<string>(prev);
      next.delete(key);
      return next;
    });
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="물품명, 카테고리 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        {/* Warehouse filter removed as per user request */}
      </div>

      <motion.div
        layout
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0"
      >
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed rounded-2xl dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/20"
            >
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              조건에 맞는 재고가 없습니다.
            </motion.div>
          ) : (
            filtered.map((inv: any, idx: number) => {
              const isLoading = loadingIds.has(
                `${inv.item_id}-${inv.warehouse_id}`,
              );
              const isLow = inv.quantity <= inv.item_min;

              return (
                <motion.div
                  key={`${inv.item_id}-${inv.warehouse_id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() =>
                    setAdjustingItem({
                      item_id: inv.item_id,
                      warehouse_id: inv.warehouse_id,
                      name: inv.item_name,
                    })
                  }
                  className={cn(
                    "relative p-6 rounded-2xl border bg-white/80 backdrop-blur-lg shadow-sm transition-all duration-300 dark:bg-zinc-900/80 cursor-pointer group",
                    isLow
                      ? "border-amber-200 shadow-amber-500/5 dark:border-amber-900/30"
                      : "border-gray-100 hover:shadow-xl hover:shadow-blue-500/10 dark:border-zinc-800",
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-0 rounded-xl overflow-hidden w-12 h-12 flex items-center justify-center shrink-0",
                          isLow
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-900/30",
                        )}
                      >
                        {inv.image_url ? (
                          <img
                            src={inv.image_url}
                            alt={inv.item_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight truncate">
                          {inv.item_name}
                        </h3>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-0.5 truncate">
                          {inv.item_category} &middot; {inv.warehouse_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-3xl font-black tabular-nums",
                          isLow
                            ? "text-amber-600"
                            : "text-gray-900 dark:text-white",
                        )}
                      >
                        {inv.quantity}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        가용 재고 (개)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center justify-between pt-5 border-t border-gray-100 dark:border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        안전 재고
                      </span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {inv.item_min} 개
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `${inv.item_name}의 해당 창고 모든 재고를 폐기 처리할까요?\n이 작업은 되돌릴 수 없습니다.`,
                              )
                            ) {
                              handleAdjust(
                                inv.item_id,
                                inv.warehouse_id,
                                -inv.quantity,
                                "즉시 폐기 처리",
                                true,
                              );
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/30"
                        >
                          폐기
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdjustingItem({
                            item_id: inv.item_id,
                            warehouse_id: inv.warehouse_id,
                            name: inv.item_name,
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        물품 수령 / 사용
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 100 }}
              className="w-full max-w-lg sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border-t sm:border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                      {adjustingItem.name}
                    </h2>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">
                      재고 수령 및 사용
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Type Selector */}
                  <div>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                      <button
                        onClick={() =>
                          setAdjustData((prev) => ({ ...prev, type: "IN" }))
                        }
                        className={cn(
                          "py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                          adjustData.type === "IN"
                            ? "bg-green-600 text-white shadow"
                            : "text-gray-500",
                        )}
                      >
                        입고
                      </button>
                      <button
                        onClick={() =>
                          setAdjustData((prev) => ({ ...prev, type: "OUT" }))
                        }
                        className={cn(
                          "py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                          adjustData.type === "OUT"
                            ? "bg-orange-600 text-white shadow"
                            : "text-gray-500",
                        )}
                      >
                        사용/출고
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      조정 수량
                    </label>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() =>
                          setAdjustData((prev) => ({
                            ...prev,
                            quantity: Math.max(1, prev.quantity - 1),
                          }))
                        }
                        className="w-16 h-16 flex-none flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 active:scale-90 transition-all shadow-sm"
                      >
                        <Minus className="w-8 h-8" />
                      </button>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={adjustData.quantity}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const numericValue = inputValue.replace(
                            /[^0-9]/g,
                            "",
                          );
                          const quantity =
                            numericValue === "" ? 0 : parseInt(numericValue);

                          setAdjustData((prev) => ({
                            ...prev,
                            quantity: quantity,
                          }));
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value) < 1) {
                            setAdjustData((prev) => ({ ...prev, quantity: 1 }));
                          }
                        }}
                        className={cn(
                          "w-24 bg-transparent border-0 p-0 h-16 text-center font-black tabular-nums focus:ring-0 dark:text-white",
                          String(adjustData.quantity).length <= 1
                            ? "text-5xl"
                            : String(adjustData.quantity).length <= 2
                              ? "text-4xl"
                              : String(adjustData.quantity).length <= 3
                                ? "text-3xl"
                                : String(adjustData.quantity).length <= 4
                                  ? "text-2xl"
                                  : "text-xl",
                        )}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setAdjustData((prev) => ({
                            ...prev,
                            quantity: prev.quantity + 1,
                          }))
                        }
                        className="w-16 h-16 flex-none flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 active:scale-90 transition-all shadow-sm"
                      >
                        <Plus className="w-8 h-8" />
                      </button>
                    </div>
                  </div>

                  {isAdmin && adjustData.type === "OUT" && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adjustData.isDisposal}
                          onChange={(e) =>
                            setAdjustData((prev) => ({
                              ...prev,
                              isDisposal: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <p className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                            자산 폐기 모드
                          </p>
                          <p className="text-[10px] text-red-500/60 font-medium">
                            체크 시 해당 물품을 폐기 처리합니다 (출고로 기록됨).
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                      조정 및 상세 사유
                    </label>
                    <textarea
                      value={adjustData.reason}
                      onChange={(e) =>
                        setAdjustData((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      placeholder={
                        adjustData.isDisposal
                          ? "폐기 사유를 입력하세요 (예: 노후화, 파손...)"
                          : "수령/사용 목적이나 특이사항을 입력하세요..."
                      }
                      className="w-full bg-gray-50 dark:bg-zinc-950 border-0 rounded-2xl p-4 text-sm font-medium min-h-[100px] resize-none focus:ring-2 ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-10 mb-2 sm:mb-0">
                  <button
                    onClick={() => {
                      setAdjustingItem(null);
                      setAdjustData({
                        quantity: 1,
                        reason: "",
                        isDisposal: false,
                        type: "OUT",
                      });
                    }}
                    className="py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 transition-all active:scale-95"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      if (!adjustingItem) return;
                      const change =
                        adjustData.type === "IN"
                          ? adjustData.quantity
                          : -adjustData.quantity;
                      await handleAdjust(
                        adjustingItem.item_id,
                        adjustingItem.warehouse_id,
                        change,
                        adjustData.reason,
                        adjustData.isDisposal,
                      );
                      setAdjustingItem(null);
                      setAdjustData({
                        quantity: 1,
                        reason: "",
                        isDisposal: false,
                        type: "OUT",
                      });
                    }}
                    className={cn(
                      "py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95",
                      adjustData.type === "IN"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-orange-600 hover:bg-orange-700",
                    )}
                  >
                    {adjustData.isDisposal ? "폐기 적용" : "수량 적용"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
