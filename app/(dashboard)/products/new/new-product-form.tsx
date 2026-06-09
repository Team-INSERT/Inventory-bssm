"use client"

import { useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { StorageLocationCombobox } from "@/components/products/storage-location-combobox"
import { LocationPickerModal } from "@/components/map/LocationPickerModal"
import { compressImage } from "@/lib/image-compression"
import { getSelectableMapRoomNames } from "@/lib/map-location-bridge"
import { STORAGE_LOCATION_OPTIONS, normalizeStorageLocation } from "@/lib/storage-locations"
import { MapPin } from "lucide-react"

type ProductFormState = {
  productNumber: string
  productName: string
  category: string
  specification: string
  quantity: string
  acquisitionDate: string
  usefulLife: string
  storageLocation: string
  photoUrl: string
  notes: string
}

const initialState: ProductFormState = {
  productNumber: "",
  productName: "",
  category: "",
  specification: "",
  quantity: "",
  acquisitionDate: "",
  usefulLife: "",
  storageLocation: STORAGE_LOCATION_OPTIONS[0],
  photoUrl: "",
  notes: "",
}

function toNullableString(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function NewProductForm() {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormState>(initialState)
  const [loading, setLoading] = useState(false)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [error, setError] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [success, setSuccess] = useState("")
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const locationOptions = useMemo(() => {
    const mapRooms = getSelectableMapRoomNames()
    return [...STORAGE_LOCATION_OPTIONS, ...mapRooms]
  }, [])

  const [pickerOpen, setPickerOpen] = useState(false)

  const productNumberIsValid = /^\d{8}-\d{8}$/.test(form.productNumber)

  function updateField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    const input = e.currentTarget
    setPhotoProcessing(true)
    setPhotoError("")

    try {
      const dataUrl = await compressImage(file)
      updateField("photoUrl", dataUrl)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "이미지 처리 중 오류가 발생했습니다."
      setPhotoError(message)
    } finally {
      setPhotoProcessing(false)
      input.value = ""
    }
  }

  function handleRemovePhoto() {
    setPhotoError("")
    updateField("photoUrl", "")
    if (photoInputRef.current) {
      photoInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!productNumberIsValid) {
      setError("물품번호는 ########-######## 형식이어야 합니다.")
      return
    }

    const quantity = Number(form.quantity)
    const usefulLife = form.usefulLife.trim() === "" ? null : Number(form.usefulLife)

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("수량은 0 이상의 정수여야 합니다.")
      return
    }

    if (usefulLife !== null && (!Number.isInteger(usefulLife) || usefulLife < 0)) {
      setError("내용연수는 0 이상의 정수여야 합니다.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productNumber: form.productNumber.trim(),
          productName: form.productName.trim(),
          category: form.category.trim(),
          specification: toNullableString(form.specification),
          quantity,
          acquisitionDate: form.acquisitionDate,
          usefulLife,
          storageLocation: normalizeStorageLocation(form.storageLocation),
          photoUrl: toNullableString(form.photoUrl),
          notes: toNullableString(form.notes),
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          data?.message ??
          (response.status === 409
            ? "이미 사용 중인 물품번호입니다."
            : data?.error === "VALIDATION_ERROR"
              ? "입력값을 다시 확인하세요."
              : "물품 등록에 실패했습니다.")

        setError(message)
        setLoading(false)
        return
      }

      setSuccess("물품이 등록되었습니다. 목록으로 이동합니다.")
      setForm(initialState)

      setTimeout(() => {
        router.push("/products")
        router.refresh()
      }, 700)
    } catch {
      setError("네트워크 오류로 물품을 등록하지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const inputClassName =
    "block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Dashboard</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">물품 등록</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          신규 물품의 기본 정보와 보관 정보를 입력해 등록합니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />

        <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
          {error ? (
            <div
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {success}
            </div>
          ) : null}

          {photoError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {photoError}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-1">
              <label htmlFor="productNumber" className="text-sm font-medium text-slate-700">
                물품번호
              </label>
              <input
                id="productNumber"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={17}
                placeholder="20240001-0001"
                value={form.productNumber}
                onChange={(e) => updateField("productNumber", e.target.value.replace(/[^\d-]/g, ""))}
                pattern="\d{8}-\d{8}"
                className={inputClassName}
                aria-describedby="productNumber-help"
                required
              />
              <p id="productNumber-help" className="text-xs leading-5 text-slate-500">
                형식: 8자리 숫자-8자리 숫자
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="productName" className="text-sm font-medium text-slate-700">
                물품명
              </label>
              <input
                id="productName"
                type="text"
                autoComplete="off"
                placeholder="예: 노트북"
                value={form.productName}
                onChange={(e) => updateField("productName", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">
                분류
              </label>
              <input
                id="category"
                type="text"
                autoComplete="off"
                placeholder="예: 전자기기"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                수량
              </label>
              <input
                id="quantity"
                type="number"
                min={0}
                step={1}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="acquisitionDate" className="text-sm font-medium text-slate-700">
                취득일
              </label>
              <input
                id="acquisitionDate"
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => updateField("acquisitionDate", e.target.value)}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="usefulLife" className="text-sm font-medium text-slate-700">
                내용연수(년)
              </label>
              <input
                id="usefulLife"
                type="number"
                min={0}
                step={1}
                placeholder="선택 입력"
                value={form.usefulLife}
                onChange={(e) => updateField("usefulLife", e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="storageLocation" className="text-sm font-medium text-slate-700">
                보관 위치
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <StorageLocationCombobox
                    id="storageLocation"
                    value={form.storageLocation}
                    onChange={(value) => updateField("storageLocation", value)}
                    options={locationOptions}
                    placeholder="보관 위치 선택"
                    searchPlaceholder="보관 위치 검색"
                    required
                  />
                </div>
                <button
                  type="button"
                  data-testid="location-picker-trigger"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <MapPin className="h-4 w-4" />
                  지도
                </button>
              </div>
              <LocationPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(roomName) => {
                  updateField("storageLocation", roomName)
                  setPickerOpen(false)
                }}
                currentValue={form.storageLocation}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="specification" className="text-sm font-medium text-slate-700">
                규격 / 사양
              </label>
              <input
                id="specification"
                type="text"
                autoComplete="off"
                placeholder="선택 입력"
                value={form.specification}
                onChange={(e) => updateField("specification", e.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="photoFile" className="text-sm font-medium text-slate-700">
                제품 사진
              </label>
              <input
                id="photoFile"
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className={inputClassName}
                disabled={photoProcessing}
              />
              <p className="text-xs leading-5 text-slate-500">이미지는 자동으로 리사이즈/압축되어 저장됩니다.</p>

              {form.photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={form.photoUrl} alt="선택한 제품 사진 미리보기" className="h-56 w-full object-contain" />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/80 text-sm font-semibold text-white transition hover:bg-slate-950"
                    aria-label="제품 사진 제거"
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                비고
              </label>
              <textarea
                id="notes"
                rows={4}
                placeholder="선택 입력"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-500">
              필수 항목을 모두 입력한 뒤 등록 버튼을 눌러주세요.
            </p>

            <button
              type="submit"
              disabled={loading || photoProcessing}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading || photoProcessing ? "처리 중..." : "물품 등록"}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
