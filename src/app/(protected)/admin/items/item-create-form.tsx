"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { createItem } from "@/features/inventory/api/item-actions";

export function ItemCreateForm({
  warehouses,
}: {
  warehouses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createItem(formData);

    if (result?.error) {
      alert(result.error);
    } else {
      formRef.current?.reset();
      setPreview(null);
      router.refresh(); // 페이지 새로고침
    }
    setLoading(false);
  };

  return (
    <div className="lg:col-span-1 border rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 h-fit">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2 tracking-tight">
        <Plus className="w-5 h-5 text-blue-500" />새 물품 등록
      </h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          {/* Image Upload Area */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              물품 이미지
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-video w-full rounded-xl border-2 border-dashed border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50 flex items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/5 transition-all overflow-hidden"
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      이미지 변경
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-full shadow-sm text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium tracking-tight">
                    클릭하여 이미지 업로드
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                물품 기본 정보
              </label>
              <input
                name="name"
                required
                className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold dark:text-white mb-2"
                placeholder="전시용 맥북 프로 14"
              />
              <input
                name="category"
                required
                className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold dark:text-white mb-2"
                placeholder="카테고리 (예: IT 기기)"
              />
              <input
                name="barcode"
                className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold dark:text-white"
                placeholder="바코드 번호 (선택 사항)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  안전 재고
                </label>
                <input
                  name="min_stock"
                  type="number"
                  required
                  defaultValue="5"
                  min="0"
                  className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  생산년도
                </label>
                <input
                  name="production_year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  초기 창고
                </label>
                <select
                  name="warehouse_id"
                  className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-bold appearance-none"
                >
                  <option value="none">지정 안 함</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  초기 수량
                </label>
                <input
                  name="initial_quantity"
                  type="number"
                  defaultValue="0"
                  min="0"
                  className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                내용연수 (수명/년)
              </label>
              <input
                name="service_life"
                type="number"
                defaultValue="5"
                min="1"
                className="w-full rounded-xl bg-gray-50 dark:bg-zinc-950 border-0 p-3.5 text-sm font-black text-center"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white dark:bg-white dark:text-zinc-900 rounded-xl py-4 text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {loading ? "업로드 중..." : "신규 물품 등록"}
        </button>
      </form>
    </div>
  );
}
