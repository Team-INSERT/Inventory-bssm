import { isMapRoomLocation } from "./map-location-bridge"

export const STORAGE_LOCATION_OPTIONS = ["창고 A", "창고 B", "창고 C"] as const

export type StorageLocation = (typeof STORAGE_LOCATION_OPTIONS)[number]

export function isStorageLocation(value: string): value is StorageLocation {
  return (STORAGE_LOCATION_OPTIONS as readonly string[]).includes(value)
}

export function normalizeStorageLocation(value: string | null | undefined) {
  if (!value) return STORAGE_LOCATION_OPTIONS[0]
  if (isStorageLocation(value)) return value
  if (isMapRoomLocation(value)) return value
  return STORAGE_LOCATION_OPTIONS[0]
}
