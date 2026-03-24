'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightLeft, MoveRight, Package, Info, Plus, Minus } from 'lucide-react'
import PremiumSelect from '@/shared/ui/premium-select'
import { transferInventory } from '@/features/inventory/api/inventory-actions'

export default function ClientTransferForm({ items, warehouses }: { items: any[], warehouses: any[] }) {
  const [itemId, setItemId] = useState('')
  const [fromWhId, setFromWhId] = useState('')
  const [toWhId, setToWhId] = useState('')

  const handleAction = async (formData: FormData) => {
    formData.append('item_id', itemId)
    formData.append('from_warehouse_id', fromWhId)
    formData.append('to_warehouse_id', toWhId)
    const result = await transferInventory(formData)
    if (result?.error) alert(result.error)
  }

  return (
    <div className="grid md:grid-cols-5 gap-6 sm:gap-8 items-start mb-20">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="md:col-span-3 glass glass-dark p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ArrowRightLeft className="w-32 h-32" />
        </div>

        <form action={handleAction} className="space-y-8 relative z-10">
          <div className="space-y-6">
            <PremiumSelect
              label="물품 선택"
              placeholder="이동할 물품을 선택하세요"
              options={items.map(it => ({ id: it.id, name: it.name }))}
              value={itemId}
              onChange={setItemId}
              className="[&_button]:border-gray-200 dark:[&_button]:border-zinc-800"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <PremiumSelect
                label="출발지 (차감)"
                placeholder="출발 창고 선택"
                options={warehouses.map(wh => ({ id: wh.id, name: wh.name }))}
                value={fromWhId}
                onChange={setFromWhId}
                className="[&_button]:text-blue-500 [&_button]:bg-blue-50/30 dark:[&_button]:bg-blue-500/5"
              />
              
              <div className="hidden sm:flex justify-center pb-4">
                <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <MoveRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <PremiumSelect
                label="도착지 (가산)"
                placeholder="도착 창고 선택"
                options={warehouses.map(wh => ({ id: wh.id, name: wh.name }))}
                value={toWhId}
                onChange={setToWhId}
                className="[&_button]:text-lime-500 [&_button]:bg-lime-50/30 dark:[&_button]:bg-lime-500/5 sm:col-start-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 text-center">이동 수량</label>
                <div className="flex items-center justify-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement
                      if (input) {
                        input.value = Math.max(1, (parseInt(input.value) || 0) - 1).toString()
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full hover:bg-gray-50 active:scale-90 transition-all border border-gray-100 dark:border-zinc-700 shadow-sm"
                  >
                    <Minus className="w-4 h-4 text-gray-400" />
                  </button>
                  <input name="quantity" type="number" required min="1" defaultValue="1" className="w-16 bg-transparent border-0 p-0 text-center text-2xl font-black tabular-nums focus:ring-0 dark:text-white" />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[name="quantity"]') as HTMLInputElement
                      if (input) {
                        input.value = ((parseInt(input.value) || 0) + 1).toString()
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-900 text-white dark:bg-zinc-700 rounded-full hover:scale-110 active:scale-90 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">이동 사유 (선택 사항)</label>
                <input name="reason" className="w-full bg-gray-50 dark:bg-zinc-950 border-0 rounded-2xl p-4 text-sm font-medium h-[58px]" placeholder="사유를 입력하세요" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white dark:bg-white dark:text-zinc-900 rounded-2xl py-5 text-sm font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/10">
            재고 이동 실행
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="md:col-span-2 space-y-6"
      >
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4 text-amber-600">
            <Info className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-tight">이동 주의사항</h3>
          </div>
          <ul className="space-y-3 text-xs text-amber-900/70 dark:text-amber-400/70 font-medium leading-relaxed">
            <li className="flex gap-2">• 실재 재고 수량과 전산 수량이 일치하는지 확인 필수</li>
            <li className="flex gap-2">• 이동 시 "출발 창고"에서 자동 차감되며 "도착 창고"로 자동 합산됩니다.</li>
            <li className="flex gap-2">• 모든 이동 내역은 관리자 타임라인에 즉시 기록됩니다.</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
