'use client'

import { useState } from 'react'
import SVGWarehouseMap from '@/widgets/warehouse-map/ui/svg-warehouse-map'
import InventoryGrid from '@/widgets/inventory-overview/ui/inventory-grid'
import { motion, AnimatePresence } from 'framer-motion'

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
  isAdmin 
}: { 
  initialData: InventoryItem[], 
  warehouses: { id: string, name: string }[],
  isAdmin: boolean
}) {
  const [activeZone, setActiveZone] = useState<string | null>(null)

  const handleZoneSelect = (zoneId: string | null) => {
    setActiveZone(zoneId)
  }

  const filteredData = activeZone 
    ? initialData.filter(item => item.warehouse_id === activeZone)
    : initialData

  return (
    <div className="flex flex-col gap-6 sm:gap-10 pb-20 sm:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <SVGWarehouseMap 
          activeZone={activeZone} 
          onZoneSelect={handleZoneSelect} 
        />
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeZone || 'all'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                {activeZone ? `${activeZone.replace('zone-', '').toUpperCase()} 구역 재고 현황` : '전체 재고 현황'}
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
  )
}
