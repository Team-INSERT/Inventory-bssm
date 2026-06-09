"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Loader2, Plus } from "lucide-react"
import { ActionModal } from "./action-modal"

type Props = {
  open: boolean
  onClose: () => void
  productId: number
  currentQuantity: number
  onSuccess: () => void
}

export function AdjustActionModal({ open, onClose, productId, currentQuantity, onSuccess }: Props) {
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setQuantity("1")
    setNotes("")
    setError("")
  }, [open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const parsedQuantity = Number(quantity)

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError("수량은 1 이상이어야 합니다.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/adjust`, {
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
        throw new Error(data?.message || "수량 조정에 실패했습니다.")
      }

      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "수량 조정에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="수량 조정"
      description="현재 보유 수량에서 추가할 수량을 입력합니다."
      icon={Plus}
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="adjust-quantity" className="text-sm font-medium text-slate-700">
            추가 수량
          </label>
          <input
            id="adjust-quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
            required
          />
          <p className="text-xs leading-5 text-slate-500">현재 수량: {currentQuantity.toLocaleString()}개</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="adjust-notes" className="text-sm font-medium text-slate-700">
            비고
          </label>
          <textarea
            id="adjust-notes"
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
              "수량 추가"
            )}
          </button>
        </div>
      </form>
    </ActionModal>
  )
}
