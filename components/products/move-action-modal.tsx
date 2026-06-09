"use client"

import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Loader2, MapPin } from "lucide-react"
import { ActionModal } from "./action-modal"
import { StorageLocationCombobox } from "@/components/products/storage-location-combobox"
import { LocationPickerModal } from "@/components/map/LocationPickerModal"
import { getSelectableMapRoomNames } from "@/lib/map-location-bridge"
import { STORAGE_LOCATION_OPTIONS, normalizeStorageLocation } from "@/lib/storage-locations"

type Props = {
  open: boolean
  onClose: () => void
  productId: number
  currentLocation: string
  onSuccess: () => void
}

export function MoveActionModal({ open, onClose, productId, currentLocation, onSuccess }: Props) {
  const [newLocation, setNewLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  const locationOptions = useMemo(() => {
    const mapRooms = getSelectableMapRoomNames()
    return [...STORAGE_LOCATION_OPTIONS, ...mapRooms]
  }, [])

  useEffect(() => {
    if (!open) return

    setNewLocation(normalizeStorageLocation(currentLocation))
    setNotes("")
    setError("")
  }, [currentLocation, open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const trimmedLocation = newLocation.trim()

    if (!trimmedLocation) {
      setError("새 위치를 선택하세요.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newLocation: trimmedLocation,
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.message || "위치이동에 실패했습니다.")
      }

      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "위치이동에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="위치이동"
      description="보관 위치를 새 장소로 변경합니다."
      icon={MapPin}
    >
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="move-location" className="text-sm font-medium text-slate-700">
            새 위치
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <StorageLocationCombobox
                id="move-location"
                value={newLocation}
                onChange={setNewLocation}
                options={locationOptions}
                placeholder="새 위치 선택"
                searchPlaceholder="새 위치 검색"
                required
              />
            </div>
            <button
              type="button"
              data-testid="move-location-picker-trigger"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              지도
            </button>
          </div>
          <p className="text-xs leading-5 text-slate-500">현재 위치: {currentLocation}</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="move-notes" className="text-sm font-medium text-slate-700">
            비고
          </label>
          <textarea
            id="move-notes"
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
                이동 중...
              </>
            ) : (
              "위치이동"
            )}
          </button>
        </div>
      </form>
      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(roomName) => {
          setNewLocation(roomName)
          setPickerOpen(false)
        }}
        currentValue={newLocation}
      />
    </ActionModal>
  )
}
