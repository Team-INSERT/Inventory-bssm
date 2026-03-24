import { notFound } from "next/navigation"
import { SerialManagementClient } from "./serial-management-client"
import { Package, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  // Mock Data for UI Publishing (Backend features bypassed as requested)
  const item = {
    id: params.id,
    name: "맥북 프로 14인치 (Mock)",
    category: "노트북",
    image_url: "",
    production_year: 2024,
    has_service_life: true,
    service_life: 5,
    has_serial_number: true,
  }

  const warehouses = [
    { id: "w-a", name: "A 창고" },
    { id: "w-b", name: "B 창고" },
    { id: "w-c", name: "C 창고" },
  ]

  const itemSerials = [
    { id: "s-1", serial_number: "MAC-2024-001", status: "AVAILABLE", warehouse_id: "w-a" },
    { id: "s-2", serial_number: "MAC-2024-002", status: "IN_USE", warehouse_id: "w-b" },
    { id: "s-3", serial_number: "MAC-2024-003", status: "REPAIR", warehouse_id: "w-c" },
    { id: "s-4", serial_number: "MAC-2024-004", status: "AVAILABLE", warehouse_id: "w-a" },
  ]

  return (
    <div className="space-y-8 pb-20">
      <div className="px-4 sm:px-0 flex items-center gap-4">
        <Link 
          href="/admin/items" 
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-700 dark:text-white flex items-center gap-2">
            {item.name} 상세 관리
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            개별 시리얼 넘버 등록 및 배치 관리
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="aspect-square bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-8 relative group cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain drop-shadow-md group-hover:opacity-50 transition-opacity" />
              ) : (
                <Package className="w-24 h-24 text-gray-300 dark:text-zinc-800 group-hover:scale-110 transition-transform" />
              )}
              
              {/* Photo Upload Overlay (Publishing) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 dark:bg-black/40">
                <div className="bg-white/90 backdrop-blur-sm dark:bg-zinc-800/90 text-gray-500 dark:text-gray-300 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all font-black text-xs uppercase tracking-widest border border-black/5 dark:border-zinc-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  대표 사진 변경
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{item.category}</div>
                <div className="text-xl font-black text-gray-900 dark:text-white">{item.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5 dark:border-zinc-800">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">생산연도</div>
                  <div className="font-black mt-0.5">{item.production_year}년</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">내용연수</div>
                  <div className="font-black mt-0.5">
                    {item.has_service_life ? `${item.service_life}년` : '적용 안됨'}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">기능 활성화</div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                    개별 자산 추적
                  </span>
                  {item.has_service_life && (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase tracking-widest">
                      수명 주기 관리
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <SerialManagementClient 
            item={item} 
            warehouses={warehouses || []} 
            initialSerials={itemSerials || []} 
          />
        </div>
      </div>
    </div>
  )
}
