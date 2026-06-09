import { campusWgs84FeatureCollection } from "school-floor-map/data/campus-wgs84";
import type { CampusWgs84Feature } from "school-floor-map";

// ─── Feature predicate ────────────────────────────────────────────

function isSelectableFeature(feature: CampusWgs84Feature): boolean {
  if (!feature.properties.interactive) return false;
  const displayName = feature.properties.name_ko || feature.properties.name;
  return Boolean(displayName);
}

// ─── Cached selectable room names ──────────────────────────────────

let _selectableRoomNames: string[] | undefined;

function getSelectableRoomNamesCached(): string[] {
  if (_selectableRoomNames !== undefined) return _selectableRoomNames;

  const seen = new Set<string>();
  const names: string[] = [];

  for (const feature of campusWgs84FeatureCollection.features) {
    if (!isSelectableFeature(feature)) continue;

    // Prefer name_ko; fall back to name
    const displayName =
      feature.properties.name_ko || feature.properties.name;
    if (!displayName) continue;

    if (!seen.has(displayName)) {
      seen.add(displayName);
      names.push(displayName);
    }
  }

  names.sort();

  _selectableRoomNames = names;
  return _selectableRoomNames;
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Returns deduplicated, alphabetically sorted Korean display names of all
 * interactive room-like features in the campus map data.
 */
export function getSelectableMapRoomNames(): string[] {
  return getSelectableRoomNamesCached();
}

/**
 * Returns true when `value` exactly matches one of the selectable room names.
 * No fuzzy / partial matching.
 */
export function isMapRoomLocation(value: string): boolean {
  return getSelectableRoomNamesCached().includes(value);
}

/**
 * Bridges a legacy `storageLocation` string to a map room name.
 *
 * - `null` / `undefined` / empty string → `undefined`
 * - Exact match against selectable rooms → the room name
 * - No match → `undefined` (no coercion)
 */
export function bridgeLocationToRoom(
  storageLocation: string | null | undefined,
): string | undefined {
  if (!storageLocation) return undefined;
  if (getSelectableRoomNamesCached().includes(storageLocation)) {
    return storageLocation;
  }
  return undefined;
}

/**
 * Returns a human-readable display name for a location value.
 *
 * - If the value matches a selectable map room, returns its `name_ko` display name.
 * - Otherwise returns the raw value (or `""` for falsy input).
 */
export function getLocationDisplayName(
  value: string | null | undefined,
): string {
  if (!value) return "";
  if (isMapRoomLocation(value)) return value;
  return value;
}
