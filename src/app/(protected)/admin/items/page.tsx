import { createClient } from '@/shared/api/supabase/server'
import { createItem, deleteItem } from '@/features/inventory/api/item-actions'
import { Plus, Trash2, Package, History } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ItemCreateForm } from './item-create-form'
import { ItemEditModal } from './item-edit-modal'

export default async function ItemsPage() {
  const supabase = await createClient()
  const [
    { data: items },
    { data: warehouses },
    { data: inventory }
  ] = await Promise.all([
    supabase.from('items').select('*').order('created_at', { ascending: false }),
    supabase.from('warehouses').select('*').order('name'),
    supabase.from('inventory').select('*')
  ])

  return (
    <div className="space-y-8 pb-20">
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">물품 마스터 관리</h1>
        <p className="text-gray-500 font-medium tracking-tight">시스템 전체에서 취급하는 모든 자산의 스펙과 수명 주기를 관리합니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 px-4 sm:px-0">
        {/* Form for new items */}
        <ItemCreateForm warehouses={warehouses || []} />

        {/* List of items */}
        <div className="lg:col-span-2 border rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">물품 정보</th>
                <th className="px-4 py-3">자산 상세</th>
                <th className="px-4 py-3">현재 재고</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {!items || items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">등록된 물품이 없습니다.</td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-50" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>생산: <span className="font-bold">{item.production_year}년</span></div>
                        <div>수명: <span className="font-bold">{item.service_life}년</span></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">
                          {inventory?.filter((inv: any) => inv.item_id === item.id).reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0} 개
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">전체 창고 합계</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const currentYear = new Date().getFullYear()
                        const isExpired = item.production_year && item.service_life && (currentYear > item.production_year + item.service_life)
                        return (
                          <span className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
                            isExpired ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            {isExpired ? '폐기 대상' : '정상 운용'}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ItemEditModal item={item} />
                        <form action={async () => {
                          'use server';
                          await deleteItem(item.id);
                        }}>
                          <button type="submit" className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-90">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
