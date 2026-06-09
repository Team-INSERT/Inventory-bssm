"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  ArrowRight,
  History,
  Package,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
  RotateCcw,
  LogOut,
  Loader2,
} from "lucide-react"
import { UseActionModal } from "@/components/products/use-action-modal"
import { MoveActionModal } from "@/components/products/move-action-modal"
import { DisposeActionModal } from "@/components/products/dispose-action-modal"
import { AdjustActionModal } from "@/components/products/adjust-action-modal"

type ProductDetail = {
  id: number
  productNumber: string
  productName: string
  category: string
  specification: string | null
  quantity: number
  acquisitionDate: string
  usefulLife: number | null
  storageLocation: string
  photoUrl: string | null
  notes: string | null
  status: "ACTIVE" | "DISPOSED"
  disposedAt: string | null
  disposedQuantity: number | null
  createdAt: string
  updatedAt: string
}

type ProductHistoryItem = {
  id: number
  actionType: string
  quantity: number | null
  previousLocation: string | null
  newLocation: string | null
  performedAt: string
  notes: string | null
  user: {
    id: number
    name: string
  }
}

type ProductHistoryMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type UserRole = "ADMIN" | "USER"
type ModalType = "use" | "move" | "dispose" | "adjust" | null

function formatDate(dateString: string | null) {
  if (!dateString) return "-"
  try {
    return format(new Date(dateString), "yyyy년 MM월 dd일")
  } catch {
    return dateString
  }
}

function calculateEndOfLife(acquisitionDate: string, usefulLife: number | null) {
  if (!usefulLife) return null
  const date = new Date(acquisitionDate)
  date.setFullYear(date.getFullYear() + usefulLife)
  return date
}

function isOverUsefulLife(acquisitionDate: string, usefulLife: number | null) {
  const endDate = calculateEndOfLife(acquisitionDate, usefulLife)
  if (!endDate) return false
  return new Date() > endDate
}

function getHistoryActionLabel(actionType: string) {
  switch (actionType) {
    case "USE":
      return "사용"
    case "MOVE":
      return "이동"
    case "DISPOSE":
      return "폐기"
    case "RESTORE":
      return "복구"
    case "RECOVER":
      return "수량 복구"
    case "ADJUST":
      return "수량 조정"
    default:
      return actionType
  }
}

function getHistoryActionClass(actionType: string) {
  switch (actionType) {
    case "USE":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "MOVE":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "DISPOSE":
      return "border-rose-200 bg-rose-50 text-rose-700"
    case "RESTORE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "RECOVER":
      return "border-violet-200 bg-violet-50 text-violet-700"
    case "ADJUST":
      return "border-indigo-200 bg-indigo-50 text-indigo-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = typeof params?.id === "string" ? params.id : ""

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [history, setHistory] = useState<ProductHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState("")
  const [historyMeta, setHistoryMeta] = useState<ProductHistoryMeta | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        if (response.status === 404) {
          setError("물품을 찾을 수 없습니다.")
          return
        }
        throw new Error(data.message || "물품 정보를 불러오지 못했습니다.")
      }

      setProduct(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "물품 정보를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [productId, router])

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        setUserRole(session?.user?.role || null)
      })
      .catch(() => setUserRole(null))

    void loadProduct()
  }, [loadProduct])

  useEffect(() => {
    async function loadHistory() {
      try {
        setHistoryLoading(true)
        const response = await fetch(`/api/products/${productId}/history?page=${historyPage}&limit=10`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error(data.message || "이력을 불러오지 못했습니다.")
        }

        setHistory(data.data)
        setHistoryMeta(data.meta)
        setHistoryError("")
      } catch (err) {
        setHistoryError(err instanceof Error ? err.message : "이력을 불러오지 못했습니다.")
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [historyPage, productId, router])

  async function handleRestore() {
    if (!product || !confirm("이 물품을 복구하시겠습니까?")) return

    setActionLoading("restore")
    try {
      const response = await fetch(`/api/products/${productId}/restore`, {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "복구에 실패했습니다.")
      }

      setProduct(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "복구에 실패했습니다.")
    } finally {
      setActionLoading(null)
    }
  }

  async function refreshProduct() {
    await loadProduct()
  }

  async function refreshHistory() {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}/history?page=${historyPage}&limit=10`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(data.message || "이력을 불러오지 못했습니다.")
      }

      setHistory(data.data)
      setHistoryMeta(data.meta)
      setHistoryError("")
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "이력을 불러오지 못했습니다.")
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-4 text-sm text-slate-600">물품 정보를 불러오는 중...</p>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="space-y-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </Link>

        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-rose-700">{error || "물품을 찾을 수 없습니다."}</p>
        </div>
      </section>
    )
  }

  const isAdmin = userRole === "ADMIN"
  const isDisposed = product.status === "DISPOSED"
  const overUsefulLife = isOverUsefulLife(product.acquisitionDate, product.usefulLife)
  const endOfLife = calculateEndOfLife(product.acquisitionDate, product.usefulLife)

  return (
    <section className="space-y-6">
      <UseActionModal
        open={activeModal === "use"}
        onClose={() => setActiveModal(null)}
        productId={Number(productId)}
        currentQuantity={product.quantity}
        onSuccess={() => {
          setActiveModal(null)
          void refreshProduct()
          void refreshHistory()
        }}
      />
      <MoveActionModal
        open={activeModal === "move"}
        onClose={() => setActiveModal(null)}
        productId={Number(productId)}
        currentLocation={product.storageLocation}
        onSuccess={() => {
          setActiveModal(null)
          void refreshProduct()
          void refreshHistory()
        }}
      />
      <DisposeActionModal
        open={activeModal === "dispose"}
        onClose={() => setActiveModal(null)}
        productId={Number(productId)}
        currentQuantity={product.quantity}
        productName={product.productName}
        onSuccess={() => {
          setActiveModal(null)
          void refreshProduct()
          void refreshHistory()
        }}
      />
      <AdjustActionModal
        open={activeModal === "adjust"}
        onClose={() => setActiveModal(null)}
        productId={Number(productId)}
        currentQuantity={product.quantity}
        onSuccess={() => {
          setActiveModal(null)
          void refreshProduct()
          void refreshHistory()
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            목록으로 돌아가기
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {product.productName}
            </h1>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                isDisposed
                  ? "border-slate-200 bg-slate-100 text-slate-500"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isDisposed ? "폐기됨" : "사용중"}
            </span>
            {overUsefulLife && !isDisposed && (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                내용연수 초과
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-600">
            물품번호: <span className="font-medium text-slate-900">{product.productNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && !isDisposed && (
            <>
              <Link
                href={`/products/${productId}/edit`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4" />
                수정
              </Link>
              <button
                type="button"
                onClick={() => setActiveModal("dispose")}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                폐기
              </button>
            </>
          )}

          {isAdmin && isDisposed && (
            <button
              onClick={handleRestore}
              disabled={actionLoading === "restore"}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === "restore" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              복구
            </button>
          )}

          {!isDisposed && (
            <>
              <button
                type="button"
                onClick={() => setActiveModal("use")}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                사용처리
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("move")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4" />
                위치이동
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("adjust")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                수량조정
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
              <Package className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">기본 정보</h2>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">물품명</p>
                <p className="mt-1 text-base font-medium text-slate-950">{product.productName}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">분류</p>
                <p className="mt-1 text-base font-medium text-slate-950">{product.category}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">물품번호</p>
                <p className="mt-1 font-mono text-base text-slate-950">{product.productNumber}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">현재 수량</p>
                <p className="mt-1 text-base font-medium text-slate-950">{product.quantity.toLocaleString()}개</p>
              </div>

              {product.specification && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">규격/사양</p>
                  <p className="mt-1 text-base text-slate-950">{product.specification}</p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
              <Calendar className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">취득 정보</h2>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">취득일</p>
                <p className="mt-1 text-base font-medium text-slate-950">
                  {formatDate(product.acquisitionDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">내용연수</p>
                <p className="mt-1 text-base font-medium text-slate-950">
                  {product.usefulLife ? `${product.usefulLife}년` : "미지정"}
                </p>
              </div>

              {endOfLife && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">내용연수 만료일</p>
                  <p
                    className={`mt-1 text-base font-medium ${
                      overUsefulLife ? "text-amber-600" : "text-slate-950"
                    }`}
                  >
                    {formatDate(endOfLife.toISOString())}
                    {overUsefulLife && " (초과)"}
                  </p>
                </div>
              )}

              {isDisposed && product.disposedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">폐기일</p>
                  <p className="mt-1 text-base font-medium text-rose-600">
                    {formatDate(product.disposedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {product.notes && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
                <FileText className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">비고</h2>
              </div>
              <div className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{product.notes}</p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">이력</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {historyMeta?.total ?? 0}건
                </span>
              </div>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-16 rounded-full bg-slate-200" />
                        <div className="h-4 w-40 rounded bg-slate-200" />
                      </div>
                      <div className="mt-3 h-4 w-32 rounded bg-slate-200" />
                      <div className="mt-2 h-4 w-48 rounded bg-slate-200" />
                      <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : historyError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {historyError}
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  이력이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="relative rounded-2xl border border-slate-200 p-4 pl-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getHistoryActionClass(item.actionType)}`}
                        >
                          {getHistoryActionLabel(item.actionType)}
                        </span>
                        <span className="text-sm font-medium text-slate-950">{item.user.name}</span>
                        <span className="text-sm text-slate-500">· {format(new Date(item.performedAt), "yyyy년 MM월 dd일 HH:mm")}</span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-700">
                        {item.quantity !== null && <p>수량: {item.quantity.toLocaleString()}개</p>}
                        {item.previousLocation || item.newLocation ? (
                          <p>
                            {item.previousLocation || "-"} → {item.newLocation || "-"}
                          </p>
                        ) : null}
                        {item.notes ? <p className="text-slate-500">{item.notes}</p> : null}
                      </div>
                      {isAdmin && item.actionType === "USE" && (
                        <button
                          onClick={async () => {
                            if (!confirm("이 사용 이력을 복구하시겠습니까? 수량이 되돌아갑니다.")) return
                            try {
                              const response = await fetch(`/api/products/${productId}/history/${item.id}/recover`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({}),
                              })
                              if (!response.ok) {
                                const data = await response.json().catch(() => ({}))
                                throw new Error(data.message || "복구에 실패했습니다.")
                              }
                              await loadProduct()
                              await refreshHistory()
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "복구에 실패했습니다.")
                            }
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100"
                        >
                          <RotateCcw className="h-3 w-3" />
                          사용 복구
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                      disabled={historyPage <= 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      이전
                    </button>
                    <span className="text-sm text-slate-500">
                      {historyMeta ? `${historyMeta.page} / ${historyMeta.totalPages}` : "1 / 1"}
                    </span>
                    <button
                      onClick={() => setHistoryPage((page) => page + 1)}
                      disabled={historyMeta ? historyPage >= historyMeta.totalPages : true}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      다음
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
              <MapPin className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">보관 정보</h2>
            </div>

            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">보관 위치</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{product.storageLocation}</p>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>등록일</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(product.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>최종 수정</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(product.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
              <ImageIcon className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">사진</h2>
            </div>

            <div className="p-6">
              {product.photoUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.photoUrl}
                    alt={product.productName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <ImageIcon className="h-12 w-12" />
                  <p className="mt-2 text-sm">등록된 사진이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {!isDisposed && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
                <Clock className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">빠른 작업</h2>
              </div>

              <div className="space-y-2 p-4">
                <button
                  type="button"
                  onClick={() => setActiveModal("use")}
                  className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  사용처리
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("move")}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <MapPin className="h-4 w-4" />
                  위치이동
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("adjust")}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  수량조정
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
