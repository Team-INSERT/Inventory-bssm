import { createClient } from '@/shared/api/supabase/server'
import { createItem, deleteItem } from '@/features/inventory/api/item-actions'
import { Plus, Trash2, Package, History } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ItemCreateForm } from './item-create-form'
import { CategoryGroup } from './category-group'

export default async function ItemsPage() {
  const supabase = await createClient()
  const [
    { data: items },
    { data: warehouses },
    { data: inventory },
    { data: itemSerials }
  ] = await Promise.all([
    supabase.from('items').select('*').order('created_at', { ascending: false }),
    supabase.from('warehouses').select('*').order('name'),
    supabase.from('inventory').select('*'),
    supabase.from('item_serials').select('*')
  ])

  const groupedItems = items?.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {}) || {};

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
        <div className="lg:col-span-2 border border-black/5 rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
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
            <tbody className="divide-y divide-black/5 dark:divide-zinc-800">
              {Object.keys(groupedItems).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">등록된 물품이 없습니다.</td>
                </tr>
              ) : (
                Object.entries(groupedItems).map(([category, categoryItems]: [string, any]) => (
                  <CategoryGroup 
                    key={category} 
                    category={category}
                    items={categoryItems} 
                    inventory={inventory || []} 
                    warehouses={warehouses || []} 
                    itemSerials={itemSerials || []} 
                  />
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
