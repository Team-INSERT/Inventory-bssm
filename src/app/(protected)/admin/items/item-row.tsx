"use client";

import { useState } from "react";
import { Package, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { ItemEditModal } from "./item-edit-modal";
import { deleteItem } from "@/features/inventory/api/item-actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { deleteSerialNumber, updateSerialNumberStatus } from "@/features/inventory/api/serial-actions";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ItemRow({ 
  item, 
  inventory, 
  warehouses, 
  itemSerials 
}: { 
  item: any; 
  inventory: any[]; 
  warehouses: any[];
  itemSerials: any[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentYear = new Date().getFullYear();
  const isExpired = item.has_service_life && item.production_year && item.service_life && (currentYear > item.production_year + item.service_life);

  const totalQuantity = item.has_serial_number 
    ? itemSerials.filter(s => s.item_id === item.id).length 
    : inventory?.filter((inv: any) => inv.item_id === item.id).reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;

  const itemSpecificSerials = itemSerials.filter(s => s.item_id === item.id);

  return (
    <>
      <motion.tr 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group" 
        onClick={() => item.has_serial_number && setIsExpanded(!isExpanded)}
      >
        <td className="px-4 py-3 font-medium">
          <div className="flex items-center gap-2">
            {item.has_serial_number && (
              <div className="text-gray-400">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            )}
            <div className="w-10 h-10 bg-gray-100 rounded-lg dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-5 h-5 text-gray-50" />
              )}
            </div>
            <div className="min-w-0 flex-1 break-keep">
              <div className="font-bold flex items-center gap-2 flex-wrap">
                <span className="line-clamp-2">{item.name}</span>
                {item.has_serial_number && <span className="px-1.5 py-px rounded-md bg-blue-100/80 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] uppercase tracking-wider whitespace-nowrap font-bold">시리얼 지원</span>}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest whitespace-nowrap">{item.category}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-xs text-gray-500 space-y-1 whitespace-nowrap">
            <div>생산: <span className="font-bold">{item.production_year}년</span></div>
            {item.has_service_life ? (
              <div>수명: <span className="font-bold">{item.service_life}년</span></div>
            ) : (
              <div>수명: <span className="font-bold text-gray-400">적용 안됨</span></div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
              {totalQuantity} {item.has_serial_number ? "대" : "개"}
            </span>
            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">전체 창고 합계</span>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {item.has_service_life ? (
            <span className={cn(
              "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest whitespace-nowrap",
              isExpired ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {isExpired ? '폐기 대상' : '정상 운용'}
            </span>
          ) : (
            <span className="text-[10px] font-black px-2 py-1 rounded-md bg-gray-100 text-gray-500 uppercase tracking-widest whitespace-nowrap">
              영구 사용
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <ItemEditModal item={item} />
            <form action={async () => { await deleteItem(item.id); }}>
              <button type="submit" className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-90">
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </td>
      </motion.tr>

      {/* Expanded Folder View for Serial Numbers */}
      <AnimatePresence>
      {item.has_serial_number && isExpanded && (
        <motion.tr 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-blue-50/30 dark:bg-blue-900/10"
        >
          <td colSpan={5} className="p-0">
            <div className="px-12 py-6 border-b border-blue-100/50 dark:border-blue-900/20 shadow-inner flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-950/50">
              <div className="text-center mb-4">
                <span className="text-sm font-black text-gray-900 dark:text-white block">총 {itemSpecificSerials.length}개의 시리얼 넘버가 등록되어 있습니다</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap mt-1 block">개별 자산 관리를 위해 상세 페이지로 이동하세요</span>
              </div>
              <Link href={`/admin/items/${item.id}`}>
                <div className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
                  <span>시리얼 단독 관리 페이지</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </td>
        </motion.tr>
      )}
      </AnimatePresence>
    </>
  );
}
