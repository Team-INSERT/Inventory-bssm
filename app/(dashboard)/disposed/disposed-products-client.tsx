"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, RefreshCw, Trash2 } from "lucide-react"
import { format } from "date-fns"

type DisposedProductRecord = {
  id: number
  productNumber: string
  productName: string
  category: string
  quantity: number
  storageLocation: string
  status: string
  disposedAt: string | null
  disposedQuantity: number | null
  updatedAt: string
}

type DisposedProductsResponse = {
  success: boolean
  data: DisposedProductRecord[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const PAGE_LIMIT = 10

function formatDate(value: string | null) {
  if (!value) return "-"

  return format(new Date(value), "yyyy.MM.dd")
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4" colSpan={8}>
        <div className="grid grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-slate-200" />
          ))}
        </div>
      </td>
    </tr>
  )
}

export function DisposedProductsClient() {
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<DisposedProductRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadDisposedProducts() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/products/disposed?page=${page}&limit=${PAGE_LIMIT}`)
        const payload = (await response.json().catch(() => null)) as DisposedProductsResponse | null

        if (!response.ok) {
          const message =
            response.status === 401
              ? "로그인이 필요합니다."
              : response.status === 403
                ? "목록을 조회할 권한이 없습니다."
                : "폐기 목록을 불러오지 못했습니다."

          if (!ignore) setError(message)
          return
        }

        if (!ignore && payload) {
          setProducts(payload.data ?? [])
          setTotal(payload.meta?.total ?? 0)
          setTotalPages(payload.meta?.totalPages ?? 1)
          setPage(payload.meta?.page ?? page)
        }
      } catch {
        if (!ignore) setError("네트워크 오류로 폐기 목록을 불러오지 못했습니다.")
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadDisposedProducts()

    return () => {
      ignore = true
    }
  }, [page, refreshIndex])

  const showingStart = useMemo(() => {
    if (total === 0) return 0
    return (page - 1) * PAGE_LIMIT + 1
  }, [page, total])

  const showingEnd = useMemo(() => {
    if (total === 0) return 0
    return Math.min(page * PAGE_LIMIT, total)
  }, [page, total])

  const canGoPrev = page > 1 && !loading
  const canGoNext = page < totalPages && !loading

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">폐기 처리 물품</h3>
          <p className="mt-1 text-sm text-slate-600">부분 폐기와 완전 폐기를 함께 확인합니다.</p>
        </div>
        <div className="text-sm text-slate-500">
          총 {total.toLocaleString()}건 · {page} / {Math.max(totalPages, 1)} 페이지
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[960px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                물품번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                물품명
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                분류
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                폐기 수량
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                잔여 수량
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                위치
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                폐기일
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                상세
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              Array.from({ length: PAGE_LIMIT }).map((_, index) => <SkeletonRow key={index} />)
            ) : products.length === 0 ? (
              <tr>
                <td className="px-6 py-16 text-center" colSpan={8}>
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-950">폐기된 물품이 없습니다.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      현재 표시할 폐기 물품이 없거나, 조건에 맞는 결과가 없습니다.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="cursor-pointer transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <Link href={`/products/${product.id}`} className="text-sm font-semibold text-slate-950 hover:underline">
                      {product.productNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <Link href={`/products/${product.id}`} className="block hover:underline">
                      <p className="text-sm font-semibold text-slate-950">{product.productName}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{product.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <span>{(product.disposedQuantity ?? product.quantity).toLocaleString()}</span>
                    {product.status === "ACTIVE" && (
                      <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        부분
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {product.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{product.storageLocation || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(product.disposedAt) !== "-" ? formatDate(product.disposedAt) : formatDate(product.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <Link href={`/products/${product.id}`} className="font-medium text-slate-900 hover:underline">
                      보기
                    </Link>
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
            ? "표시할 폐기 물품이 없습니다."
            : `${showingStart.toLocaleString()}-${showingEnd.toLocaleString()}번째 폐기 물품을 보고 있습니다.`}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshIndex((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>

          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!canGoPrev}
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
            disabled={!canGoNext}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
