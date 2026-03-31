"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, Map as MapIcon } from "lucide-react";

const ZONE_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#ec4899",
];

type WarehouseZone = {
  id: string;
  name: string;
  desc: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

function buildZones(warehouses: { id: string; name: string }[]): WarehouseZone[] {
  const columns = warehouses.length <= 1 ? 1 : warehouses.length <= 4 ? 2 : 3;
  const cardWidth = columns === 1 ? 420 : columns === 2 ? 200 : 126;
  const cardHeight = 92;
  const gap = 12;
  const totalWidth = columns * cardWidth + (columns - 1) * gap;
  const startX = (500 - totalWidth) / 2;

  return warehouses.map((warehouse, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      id: warehouse.id,
      name: warehouse.name,
      desc: `${warehouse.name} 재고 보기`,
      x: startX + col * (cardWidth + gap),
      y: 36 + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
      color: ZONE_COLORS[index % ZONE_COLORS.length],
    };
  });
}

interface SVGWarehouseMapProps {
  activeZone: string | null;
  onZoneSelect: (zoneId: string | null) => void;
  warehouses: { id: string; name: string }[];
}

export default function SVGWarehouseMap({
  activeZone,
  onZoneSelect,
  warehouses,
}: SVGWarehouseMapProps) {
  const zones = buildZones(warehouses);
  const rowCount = Math.max(1, Math.ceil(Math.max(warehouses.length, 1) / (warehouses.length <= 1 ? 1 : warehouses.length <= 4 ? 2 : 3)));
  const viewBoxHeight = 36 + rowCount * 92 + (rowCount - 1) * 12 + 36;
  const activeZoneData = zones.find((zone) => zone.id === activeZone);

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
            <MapIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
            물류 구역 관리
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {activeZone && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => onZoneSelect(null)}
              className="text-[9px] sm:text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-widest"
            >
              전체 보기
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative w-full overflow-visible rounded-[2rem] border border-black/5 bg-white/60 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="absolute inset-0 flex items-center justify-center p-0">
          <svg
            viewBox={`0 0 500 ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.12)] transition-transform duration-500"
          >
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-200 dark:text-zinc-800"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="24" />

            {zones.map((zone) => {
              const isActive = activeZone === zone.id;
              const isAnyActive = activeZone !== null;

              return (
                <g key={zone.id}>
                  {isActive && (
                    <motion.rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx="24"
                      fill={zone.color}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      filter="blur(15px)"
                      pointerEvents="none"
                    />
                  )}
                  <motion.rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    rx="24"
                    fill={zone.color}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{
                      opacity: isAnyActive ? (isActive ? 0.9 : 0.2) : 0.7,
                      scale: isActive ? 1.02 : 1,
                      filter: isActive
                        ? "brightness(1.2) drop-shadow(0 0 15px " +
                          zone.color +
                          "44)"
                        : "brightness(1) drop-shadow(0 0 0px transparent)",
                    }}
                    whileHover={{ opacity: 0.9, scale: 1.01 }}
                    className="cursor-pointer transition-all duration-500"
                    onClick={() => onZoneSelect(isActive ? null : zone.id)}
                  />
                </g>
              );
            })}

            {zones.map((zone) => {
              const isActive = activeZone === zone.id;
              const isAnyActive = activeZone !== null;
              const lines =
                zone.name.length > 18
                  ? [zone.name.slice(0, 18), zone.name.slice(18)]
                  : [zone.name];

              return (
                <motion.g
                  key={`label-${zone.id}`}
                  initial={{ opacity: 0.8 }}
                  animate={{
                    opacity: isAnyActive ? (isActive ? 1 : 0.3) : 0.8,
                    y: isActive ? -5 : 0,
                  }}
                  pointerEvents="none"
                >
                  {lines.map((line, index) => (
                    <text
                      key={`${zone.id}-${index}`}
                      x={zone.x + zone.width / 2}
                      y={zone.y + 42 + index * 18}
                      textAnchor="middle"
                      className="fill-white font-black text-xs tracking-[0.08em] drop-shadow-md select-none"
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="0.5"
                    >
                      {line}
                    </text>
                  ))}
                </motion.g>
              );
            })}
          </svg>
        </div>

        <div
          className="w-full"
          style={{ paddingTop: `${(viewBoxHeight / 500) * 100}%` }}
        />

        <AnimatePresence>
          {activeZone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-lg border border-gray-200 dark:bg-zinc-900/80 dark:border-zinc-800 shadow-lg max-w-[150px]"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                <Info className="w-3 h-3" />
                선택됨
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {activeZoneData?.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {activeZoneData?.desc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
