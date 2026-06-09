"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2, MapPin, Package, RefreshCw, Search } from "lucide-react"
import { format } from "date-fns"
import { Dropdown } from "@/components/ui/dropdown"
import { SearchableCombobox } from "@/components/ui/searchable-combobox"
import { StorageLocationCombobox } from "@/components/products/storage-location-combobox"
import { STORAGE_LOCATION_OPTIONS } from "@/lib/storage-locations"
import { getSelectableMapRoomNames } from "@/lib/map-location-bridge"
import { LocationPickerModal } from "@/components/map/LocationPickerModal"

type StatsData = {
  total: number
  active: number
  disposed: number
  usedQuantity: number
}

type ProductRecord = {
  id: number
  productNumber: string
  productName: string
  category: string
  specification: string | null
  quantity: number
  acquisitionDate: string
  storageLocation: string
  photoUrl?: string | null
  status: "ACTIVE" | "DISPOSED"
  createdAt: string
  updatedAt: string
}

type ProductListResponse = {
  success: boolean
  data: ProductRecord[] | ProductRecord
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type ProductCategoriesResponse = {
  success: boolean
  data: string[]
}

type Filters = {
  q: string
  productNumber: string
  category: string
  storageLocation: string
  status: "ACTIVE" | "DISPOSED" | "ALL"
}

type ProductsClientProps = {
  canCreateProducts: boolean
}

const PAGE_LIMIT = 10

const initialFilters: Filters = {
  q: "",
  productNumber: "",
  category: "",
  storageLocation: "",
  status: "ACTIVE",
}

const statusOptions: Array<{ value: Filters["status"]; label: string }> = [
  { value: "ACTIVE", label: "보관중" },
  { value: "DISPOSED", label: "폐기" },
  { value: "ALL", label: "전체" },
]

function formatDate(value: string | null | undefined) {
  if (!value) return "-"

  try {
    return format(new Date(value), "yyyy.MM.dd")
  } catch {
    return value
  }
}

function getStatusLabel(status: Filters["status"]) {
  switch (status) {
    case "ACTIVE":
      return "보관중"
    case "DISPOSED":
      return "폐기"
    case "ALL":
      return "전체"
  }
}

function getStatusClass(status: ProductRecord["status"]) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "DISPOSED":
      return "border-rose-200 bg-rose-50 text-rose-700"
  }
}

function ProductSkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4" colSpan={9}>
        <div className="grid grid-cols-9 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-slate-200" />
          ))}
        </div>
      </td>
    </tr>
  )
}

export function ProductsClient({ canCreateProducts }: ProductsClientProps) {
  const router = useRouter()
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const response = await fetch("/api/products/stats")
        if (!response.ok || cancelled) return
        const payload = await response.json().catch(() => null)
        if (!cancelled && payload?.success) {
          setStats(payload.data as StatsData)
        }
      } catch {
        // stats are non-critical, silently ignore
      }
    }

    void loadStats()

    return () => {
      cancelled = true
    }
  }, [refreshIndex])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const response = await fetch("/api/products/categories")
        const payload = (await response.json().catch(() => null)) as ProductCategoriesResponse | null

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login"
            return
          }

          throw new Error(
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "분류 목록을 불러오지 못했습니다.",
          )
        }

        if (cancelled || !payload) return

        setCategoryOptions(payload.data.filter((category) => category.trim() !== ""))
      } catch {
        if (!cancelled) {
          setCategoryOptions([])
        }
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoading(true)
      setError("")

      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      })

      const productNumber = appliedFilters.productNumber.trim()
      const q = appliedFilters.q.trim()
      const category = appliedFilters.category.trim()
      const storageLocation = appliedFilters.storageLocation.trim()

      if (productNumber) params.set("productNumber", productNumber)
      if (q) params.set("q", q)
      if (category) params.set("category", category)
      if (storageLocation) params.set("storageLocation", storageLocation)
      if (appliedFilters.status) params.set("status", appliedFilters.status)

      try {
        const response = await fetch(`/api/products?${params.toString()}`)
        const payload = (await response.json().catch(() => null)) as ProductListResponse | null

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login"
            return
          }

          if (response.status === 404 && productNumber) {
            if (!cancelled) {
              setError("해당 등록번호의 물품을 찾을 수 없습니다.")
              setProducts([])
              setTotal(0)
              setTotalPages(1)
            }
            return
          }

          const message =
            response.status === 400
              ? productNumber
                ? "등록번호 형식이 올바르지 않습니다."
                : "검색 조건을 다시 확인하세요."
              : payload && typeof payload === "object" && "error" in payload
                ? String(payload.error)
                : "물품 목록을 불러오지 못했습니다."

          throw new Error(message)
        }

        if (cancelled || !payload) return

        if (productNumber) {
          const matchedProducts = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : []

          if (matchedProducts.length === 1) {
            cancelled = true
            router.push(`/products/${matchedProducts[0].id}`)
            return
          }

          setProducts(matchedProducts)
          setTotal(matchedProducts.length)
          setTotalPages(1)
          return
        }

        setProducts(Array.isArray(payload.data) ? payload.data : [])
        setTotal(payload.meta?.total ?? 0)
        setTotalPages(payload.meta?.totalPages ?? 1)
        setPage(payload.meta?.page ?? page)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "물품 목록을 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [appliedFilters, page, refreshIndex, router])

  const showingStart = useMemo(() => {
    if (total === 0) return 0
    return (page - 1) * PAGE_LIMIT + 1
  }, [page, total])

  const showingEnd = useMemo(() => {
    if (total === 0) return 0
    return Math.min(page * PAGE_LIMIT, total)
  }, [page, total])

  const hasSearchFilters = useMemo(() => {
    return (
      draftFilters.q.trim() !== "" ||
      draftFilters.productNumber.trim() !== "" ||
      draftFilters.category.trim() !== "" ||
      draftFilters.storageLocation.trim() !== "" ||
      draftFilters.status !== "ACTIVE"
    )
  }, [draftFilters])

  const locationOptions = useMemo(() => {
    return [...STORAGE_LOCATION_OPTIONS, ...getSelectableMapRoomNames()]
  }, [])

  function updateDraftField<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters({ ...draftFilters })
  }

  function handleReset() {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
  }

  const currentStatusLabel = getStatusLabel(appliedFilters.status)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Dashboard</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">물품 목록</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            물품명, 물품등록번호, 분류, 보관 위치, 상태를 기준으로 목록을 조회합니다.
          </p>
        </div>

        {canCreateProducts ? (
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            물품 등록
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "전체", value: stats?.total },
          { label: "보관중", value: stats?.active },
          { label: "사용", value: stats?.usedQuantity },
          { label: "폐기", value: stats?.disposed },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {value == null ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                value.toLocaleString()
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400" />

        <form onSubmit={handleSearch} className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2">
              <label htmlFor="q" className="text-sm font-medium text-slate-700">
                물품명 / 자유검색
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="q"
                  type="text"
                  autoComplete="off"
                  value={draftFilters.q}
                  onChange={(event) => updateDraftField("q", event.target.value)}
                  className="block w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                  placeholder="물품명, 규격 등으로 검색"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="productNumber" className="text-sm font-medium text-slate-700">
                물품등록번호
              </label>
              <input
                id="productNumber"
                type="text"
                autoComplete="off"
                inputMode="numeric"
                value={draftFilters.productNumber}
                onChange={(event) => updateDraftField("productNumber", event.target.value)}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-mono text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                placeholder="20240001-0001"
              />
              <p className="text-xs leading-5 text-slate-500">정확히 일치하는 번호를 찾습니다.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">
                분류
              </label>
              <SearchableCombobox
                id="category"
                value={draftFilters.category}
                onChange={(value) => updateDraftField("category", value)}
                options={categoryOptions}
                placeholder="분류 선택"
                searchPlaceholder="분류 검색"
                allowEmpty
                emptyLabel="전체"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="storageLocation" className="text-sm font-medium text-slate-700">
                보관장소
              </label>
              <div className="flex gap-2">
                <StorageLocationCombobox
                  id="storageLocation"
                  value={draftFilters.storageLocation}
                  onChange={(value) => updateDraftField("storageLocation", value)}
                  options={locationOptions}
                  placeholder="보관장소"
                  searchPlaceholder="보관장소 검색"
                  allowEmpty
                  emptyLabel="전체"
                  className="flex-1"
                />
                <button
                  type="button"
                  data-testid="storage-location-map-trigger"
                  onClick={() => setPickerOpen(true)}
                  aria-label="지도에서 위치 선택"
                  aria-haspopup="dialog"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <MapPin className="h-4 w-4" />
                  <span>지도</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-slate-700">
                상태
              </label>
                <Dropdown
                  id="status"
                  value={draftFilters.status}
                  onChange={(event) => updateDraftField("status", event.target.value as Filters["status"])}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Dropdown>
              </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              현재 상태 필터: <span className="font-medium text-slate-900">{currentStatusLabel}</span>
              {hasSearchFilters ? <span className="ml-2 text-slate-400">(추가 검색 조건 적용됨)</span> : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                초기화
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                검색
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <div className="border-t border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="border-t border-slate-200 px-6 py-4 sm:flex sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                목록을 불러오는 중입니다.
              </span>
            ) : total === 0 ? (
              hasSearchFilters ? (
                "검색 조건에 맞는 물품이 없습니다."
              ) : (
                "현재 표시할 보관중인 물품이 없습니다."
              )
            ) : (
              `${total.toLocaleString()}건의 물품을 보고 있습니다.`
            )}
          </div>

          <button
            type="button"
            onClick={() => setRefreshIndex((current) => current + 1)}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:mt-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>

        <div className="overflow-x-auto border-t border-slate-200">
          <table className="min-w-[1120px] divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  구분
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  사진
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  물품구분/분류명
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  물품등록번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  품명/규격
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  취득일/등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  보관장소
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  상태
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: PAGE_LIMIT }).map((_, index) => <ProductSkeletonRow key={index} />)
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={9}>
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Package className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-950">
                        {hasSearchFilters ? "조건에 맞는 물품이 없습니다." : "표시할 보관중인 물품이 없습니다."}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        검색 조건을 조정하거나 초기화하여 다시 확인해 주세요.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 align-top text-sm text-slate-700">물품</td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {product.photoUrl ? (
                          <Image
                            src={product.photoUrl}
                            alt={`${product.productName} 사진`}
                            width={48}
                            height={48}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      <div className="font-medium text-slate-950">{product.category}</div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <Link href={`/products/${product.id}`} className="font-mono text-sm font-semibold text-slate-950 hover:underline">
                        {product.productNumber}
                      </Link>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <Link href={`/products/${product.id}`} className="block hover:underline">
                        <p className="text-sm font-semibold text-slate-950">{product.productName}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{product.specification || "-"}</p>
                      </Link>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">
                      <div className="font-medium text-slate-950">취득 {formatDate(product.acquisitionDate)}</div>
                      <div className="mt-1 text-slate-500">등록 {formatDate(product.createdAt)}</div>
                    </td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">{product.quantity.toLocaleString()}</td>

                    <td className="px-6 py-4 align-top text-sm text-slate-700">{product.storageLocation || "-"}</td>

                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] ${getStatusClass(product.status)}`}
                      >
                        {product.status === "ACTIVE" ? "보관중" : "폐기"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {total === 0
              ? "표시할 항목이 없습니다."
              : `${showingStart.toLocaleString()}-${showingEnd.toLocaleString()}번째 물품을 보고 있습니다.`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {page} / {Math.max(totalPages, 1)} 페이지
            </div>

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div data-testid="products-list-location-picker-modal">
        <LocationPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(roomName) => {
            updateDraftField("storageLocation", roomName)
            setPickerOpen(false)
          }}
          currentValue={draftFilters.storageLocation}
        />
      </div>
    </section>
  )
}
