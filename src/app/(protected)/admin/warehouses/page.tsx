import { createClient } from '@/shared/api/supabase/server'
import { createWarehouse, deleteWarehouse } from '@/features/inventory/api/warehouse-actions'
import { Plus, Trash2, Warehouse } from 'lucide-react'

export default async function WarehousesPage() {
  const supabase = await createClient()
  const { data: warehouses } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">창고 관리</h1>
        <p className="text-gray-500 font-medium tracking-tight">재고가 물리적으로 보관되는 창고 목록입니다. 새로운 창고를 추가하거나 삭제할 수 있습니다.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 px-4 sm:px-0">
        {/* Form for new warehouse */}
        <div className="lg:col-span-1 border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            새 창고 등록
          </h2>
          <form action={async (fd) => { 'use server'; await createWarehouse(fd); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">창고(공간) 이름</label>
              <input name="name" required className="w-full rounded-md border p-2 text-sm dark:bg-zinc-800 dark:border-zinc-700" placeholder="예: 1번 서버실" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white rounded-md p-2 text-sm font-medium hover:bg-blue-700 transition-colors">
              등록하기
            </button>
          </form>
        </div>

        {/* List of warehouses */}
        <div className="lg:col-span-2 border rounded-2xl bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">창고명</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {!warehouses || warehouses.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">등록된 창고가 없습니다.</td>
                </tr>
              ) : (
                warehouses.map((wh: any) => (
                  <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                       <Warehouse className="w-4 h-4 text-gray-400" />
                      {wh.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={async () => {
                        'use server';
                        await deleteWarehouse(wh.id);
                      }}>
                        <button type="submit" className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
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
