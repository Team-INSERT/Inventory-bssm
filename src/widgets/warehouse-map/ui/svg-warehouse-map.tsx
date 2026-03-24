'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Warehouse, Info, Map as MapIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ZONES = [
  { id: 'zone-a', name: 'A구역', desc: '본관 메세드 창고', path: 'M 50 50 L 250 50 L 250 150 L 50 150 Z', color: '#3b82f6' },
  { id: 'zone-b', name: 'B구역', desc: '신관 소모품실', path: 'M 260 50 L 450 50 L 450 250 L 260 250 Z', color: '#6366f1' },
  { id: 'zone-c', name: 'C구역', desc: '실습동 외부 창고', path: 'M 50 160 L 250 160 L 250 250 L 50 250 Z', color: '#10b981' },
]

interface SVGWarehouseMapProps {
  activeZone: string | null
  onZoneSelect: (zoneId: string | null) => void
}

export default function SVGWarehouseMap({ activeZone, onZoneSelect }: SVGWarehouseMapProps) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-2 px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
            <MapIcon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">물류 구역 관리</h2>
        </div>
        
        <AnimatePresence mode="wait">
          {activeZone && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => onZoneSelect(null)}
              className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-widest"
            >
              전체 보기
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="relative aspect-[5/3] w-full bg-transparent overflow-visible">
        <div className="absolute inset-0 flex items-center justify-center p-0">
          <svg
            viewBox="0 0 500 300"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)] scale-[1.05] sm:scale-100 transition-transform duration-500"
          >
            {/* Background Grid Patterns */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-zinc-800" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="10" />

            {/* Zones */}
            {ZONES.map((zone) => {
              const isActive = activeZone === zone.id
              const isAnyActive = activeZone !== null
              
              return (
                <g key={zone.id}>
                  {isActive && (
                    <motion.path
                      d={zone.path}
                      fill={zone.color}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      filter="blur(15px)"
                      pointerEvents="none"
                    />
                  )}
                  <motion.path
                    d={zone.path}
                    fill={zone.color}
                    initial={{ opacity: 0.6, scale: 1 }}
                    animate={{ 
                      opacity: isAnyActive ? (isActive ? 0.9 : 0.2) : 0.7,
                      scale: isActive ? 1.02 : 1,
                      filter: isActive 
                        ? 'brightness(1.2) drop-shadow(0 0 15px ' + zone.color + '44)' 
                        : 'brightness(1) drop-shadow(0 0 0px transparent)'
                    }}
                    whileHover={{ opacity: 0.9, scale: 1.01 }}
                    className="cursor-pointer transition-all duration-500"
                    onClick={() => onZoneSelect(isActive ? null : zone.id)}
                  />
                </g>
              )
            })}

            {/* Labels */}
            {ZONES.map((zone) => {
              const isActive = activeZone === zone.id
              const isAnyActive = activeZone !== null
              
              return (
                <motion.g
                  key={`label-${zone.id}`}
                  initial={{ opacity: 0.8 }}
                  animate={{ 
                    opacity: isAnyActive ? (isActive ? 1 : 0.3) : 0.8,
                    y: isActive ? -5 : 0
                  }}
                  pointerEvents="none"
                >
                  <text
                    x={zone.id === 'zone-b' ? 355 : 150}
                    y={zone.id === 'zone-c' ? 205 : 100}
                    textAnchor="middle"
                    className="fill-white font-black text-xs sm:text-sm tracking-[0.2em] drop-shadow-md select-none"
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="0.5"
                  >
                    {zone.name}
                  </text>
                </motion.g>
              )
            })}
          </svg>
        </div>

        {/* Floating Tooltip Style Info */}
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
                {ZONES.find(z => z.id === activeZone)?.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {ZONES.find(z => z.id === activeZone)?.desc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
