"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Loader2, LogOut } from "lucide-react"
import { ActionModal } from "./action-modal"

type Props = {
  open: boolean
  onClose: () => void
  productId: number
  currentQuantity: number
  onSuccess: () => void
}

export function UseActionModal({ open, onClose, productId, currentQuantity, onSuccess }: Props) {
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setQuantity("1")
    setNotes("")
    setError("")
  }, [currentQuantity, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const parsedQuantity = Number(quantity)

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("수량은 1 이상이어야 합니다.")
      return
    }

    if (parsedQuantity > currentQuantity) {
      setError("사용 수량은 현재 수량을 초과할 수 없습니다.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/use`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: parsedQuantity,
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || "사용처리에 실패했습니다.")
      }

      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용처리에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="사용처리"
      description="현재 보유 수량에서 사용된 수량을 차감합니다."
      icon={LogOut}
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="use-quantity" className="text-sm font-medium text-slate-700">
            수량
          </label>
          <input
            id="use-quantity"
            type="number"
            min={1}
            max={currentQuantity}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            required
          />
          <p className="text-xs leading-5 text-slate-500">현재 수량: {currentQuantity.toLocaleString()}개</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="use-notes" className="text-sm font-medium text-slate-700">
            비고
          </label>
          <textarea
            id="use-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            placeholder="선택 입력"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              "사용처리"
            )}
          </button>
        </div>
      </form>
    </ActionModal>
  )
}
