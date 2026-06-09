"use client"

import { useEffect, useState, useCallback } from "react"
import { CampusMapWrapper } from "@/components/map/CampusMapWrapper"
import { isMapRoomLocation } from "@/lib/map-location-bridge"
import { MapPin, X } from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────

interface LocationPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (roomName: string) => void
  currentValue?: string
}

// ─── Component ─────────────────────────────────────────────────────

export function LocationPickerModal({
  open,
  onClose,
  onSelect,
  currentValue,
}: LocationPickerModalProps) {
  const [selectedRoomName, setSelectedRoomName] = useState<
    string | undefined
  >(undefined)
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(
    undefined,
  )

  // Pre-select current value when modal opens
  useEffect(() => {
    if (open) {
      if (currentValue && isMapRoomLocation(currentValue)) {
        setSelectedRoomName(currentValue)
      } else {
        setSelectedRoomName(undefined)
      }
      setSelectedLevel(undefined)
    }
  }, [open, currentValue])

  // Escape key handler
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

  const handleRoomSelect = useCallback(
    (roomName: string) => {
      if (isMapRoomLocation(roomName)) {
        setSelectedRoomName(roomName)
      }
    },
    [],
  )

  const handleConfirm = useCallback(() => {
    if (selectedRoomName) {
      onSelect(selectedRoomName)
      onClose()
    }
  }, [selectedRoomName, onSelect, onClose])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  if (!open) return null

  const canConfirm = !!selectedRoomName

  return (
    <div
      data-testid="location-picker-modal"
      className="fixed inset-0 h-[100dvh] w-screen z-50 flex items-end justify-center bg-slate-950/55 px-0 sm:items-center sm:px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-t-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)] sm:rounded-3xl h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[700px]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                위치 선택
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                지도에서 저장 위치를 선택하세요
              </p>
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

        {/* ── Map area ──────────────────────────────────────────── */}
        <div className="relative min-h-[300px] flex-1 sm:min-h-[400px]">
          <CampusMapWrapper
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
            onRoomSelect={handleRoomSelect}
            selectedRoomName={selectedRoomName}
            className="absolute inset-0"
            isPopup={true}
          />
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div 
          className="border-t border-slate-200 px-5 pt-4 pb-4 sm:pb-6"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          {/* Selected room preview */}
          <div className="mb-3 min-h-[2rem]">
            {selectedRoomName ? (
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                <span data-testid="selected-room-name">{selectedRoomName}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                지도에서 호실을 탭하여 선택하세요
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              data-testid="location-picker-cancel"
              onClick={handleCancel}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:bg-slate-100"
            >
              취소
            </button>
            <button
              type="button"
              data-testid="location-picker-confirm"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
