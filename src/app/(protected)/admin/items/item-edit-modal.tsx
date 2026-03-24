'use client'

import { useState } from 'react'
import { Pencil, X, Loader2, Save } from 'lucide-react'
import { updateItem } from '@/features/inventory/api/item-actions'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ItemEditModal({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    barcode: item.barcode || '',
    min_stock: item.min_stock,
    production_year: item.production_year || new Date().getFullYear(),
    service_life: item.service_life || 5,
    has_serial_number: item.has_serial_number ?? false,
    has_service_life: item.has_service_life ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await updateItem(item.id, formData)
    setLoading(false)
    if (!error) {
      setIsOpen(false)
    } else {
      alert(error)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-90"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">물품 정보 수정</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Master Data Edit</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">물품 이름</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold focus:ring-2 ring-blue-500/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">카테고리</label>
                      <input 
                        type="text" 
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        required
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold focus:ring-2 ring-blue-500/20" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">안전 재고</label>
                      <input 
                        type="number" 
                        value={formData.min_stock}
                        onChange={e => setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center focus:ring-2 ring-blue-500/20" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">바코드 (선택)</label>
                    <input 
                      type="text" 
                      value={formData.barcode}
                      onChange={e => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold focus:ring-2 ring-blue-500/20" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">생산 년도</label>
                      <input 
                        type="number" 
                        value={formData.production_year}
                        onChange={e => setFormData(prev => ({ ...prev, production_year: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center focus:ring-2 ring-blue-500/20" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">생산 년도</label>
                      <input 
                        type="number" 
                        value={formData.production_year}
                        onChange={e => setFormData(prev => ({ ...prev, production_year: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center focus:ring-2 ring-blue-500/20" 
                      />
                    </div>
                    {formData.has_service_life && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">내용 연수 (년)</label>
                      <input 
                        type="number" 
                        value={formData.service_life}
                        onChange={e => setFormData(prev => ({ ...prev, service_life: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center focus:ring-2 ring-blue-500/20" 
                      />
                    </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div 
                      onClick={() => setFormData({ ...formData, has_serial_number: !formData.has_serial_number })}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-transparent cursor-pointer hover:border-blue-500/30 hover:bg-white dark:hover:bg-zinc-900 transition-all group shadow-sm"
                    >
                      <div>
                        <span className="text-sm font-black text-gray-900 dark:text-white block group-hover:text-blue-600 transition-colors">시리얼 번호</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 block">개별 자산 추적</span>
                      </div>
                      <div className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", formData.has_serial_number ? "bg-blue-600" : "bg-gray-200 dark:bg-zinc-700")}>
                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", formData.has_serial_number ? "translate-x-5" : "translate-x-0")} />
                      </div>
                    </div>

                    <div 
                      onClick={() => setFormData({ ...formData, has_service_life: !formData.has_service_life, service_life: !formData.has_service_life ? formData.service_life || 5 : null as any })}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-transparent cursor-pointer hover:border-blue-500/30 hover:bg-white dark:hover:bg-zinc-900 transition-all group shadow-sm"
                    >
                      <div>
                        <span className="text-sm font-black text-gray-900 dark:text-white block group-hover:text-blue-600 transition-colors">내용연수 적용</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 block">수명 주기 관리</span>
                      </div>
                      <div className={cn("relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out", formData.has_service_life ? "bg-blue-600" : "bg-gray-200 dark:bg-zinc-700")}>
                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out", formData.has_service_life ? "translate-x-5" : "translate-x-0")} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="py-4 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 transition-all active:scale-95"
                    >
                      취소
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 shadow-xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>저장 중</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" />
                          <span>수정 완료</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
