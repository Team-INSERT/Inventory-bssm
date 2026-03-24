'use client'

import { useState } from 'react'
import { Pencil, X, Loader2, Save } from 'lucide-react'
import { updateItem } from '@/features/inventory/api/item-actions'
import { motion, AnimatePresence } from 'framer-motion'

export function ItemEditModal({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    barcode: item.barcode || '',
    min_stock: item.min_stock,
    production_year: item.production_year || new Date().getFullYear(),
    service_life: item.service_life || 5
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
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">내용 연수 (년)</label>
                      <input 
                        type="number" 
                        value={formData.service_life}
                        onChange={e => setFormData(prev => ({ ...prev, service_life: parseInt(e.target.value) || 0 }))}
                        className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center focus:ring-2 ring-blue-500/20" 
                      />
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
