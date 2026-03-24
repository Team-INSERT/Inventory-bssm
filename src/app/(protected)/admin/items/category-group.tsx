"use client";

import { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { ItemRow } from "./item-row";
import { motion, AnimatePresence } from "framer-motion";

export function CategoryGroup({ 
  category, 
  items, 
  inventory, 
  warehouses, 
  itemSerials 
}: { 
  category: string;
  items: any[];
  inventory: any[];
  warehouses: any[];
  itemSerials: any[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-100/50 dark:bg-zinc-800/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border-y border-black/5 dark:border-zinc-800"
      >
        <td colSpan={5} className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-gray-400">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-zinc-800/50">
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div>
              <span className="font-black text-sm tracking-tight">{category}</span>
              <span className="ml-2 text-[10px] font-bold text-gray-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-black/5 dark:border-zinc-800">
                {items.length}개 품목
              </span>
            </div>
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {isExpanded && items.map(item => (
          <ItemRow 
            key={item.id} 
            item={item} 
            inventory={inventory} 
            warehouses={warehouses} 
            itemSerials={itemSerials} 
          />
        ))}
      </AnimatePresence>
    </>
  );
}
