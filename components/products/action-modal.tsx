"use client"

import { useEffect, type ReactNode } from "react"
import { X, type LucideIcon } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}

export function ActionModal({ open, onClose, title, description, icon: Icon, children }: Props) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
