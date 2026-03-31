"use client";

import { useState } from "react";
import SVGWarehouseMap from "@/widgets/warehouse-map/ui/svg-warehouse-map";
import InventoryGrid from "@/widgets/inventory-overview/ui/inventory-grid";
import { motion, AnimatePresence } from "framer-motion";

interface InventoryItem {
  item_id: string;
  warehouse_id: string;
  quantity: number;
  item_name: string;
  item_category: string;
  item_min: number;
  warehouse_name: string;
}

export default function InventoryLayout({
  initialData,
  warehouses,
  isAdmin,
}: {
  initialData: InventoryItem[];
  warehouses: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const handleZoneSelect = (zoneId: string | null) => {
    setActiveZone(zoneId);
  };
  const activeWarehouseId = activeZone;
  const activeWarehouse = warehouses.find(
    (warehouse) => warehouse.id === activeWarehouseId,
  );

  const filteredData = activeWarehouseId
    ? initialData.filter((item) => item.warehouse_id === activeWarehouseId)
    : initialData;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-20 sm:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <SVGWarehouseMap
          activeZone={activeZone}
          onZoneSelect={handleZoneSelect}
          warehouses={warehouses}
        />
      </motion.div>

      <div className="space-y-4 sm:space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeZone || "all"}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                {activeZone
                  ? `${activeWarehouse?.name || "선택 창고"} 재고 현황`
                  : "전체 재고 현황"}
              </h3>
            </div>
            <InventoryGrid
              initialData={filteredData}
              warehouses={warehouses}
              isAdmin={isAdmin}
              hideWarehouseFilter={activeZone !== null}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
