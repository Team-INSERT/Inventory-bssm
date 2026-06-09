"use client";

import {
  Component,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { campusWgs84FeatureCollection } from "school-floor-map/data/campus-wgs84";
import { schoolOutlineFeatureCollection } from "school-floor-map/data/school-outline";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────

export interface CampusMapWrapperProps {
  selectedLevel?: string;
  onLevelChange?: (levelId: string) => void;
  onRoomSelect?: (roomName: string, levelId: string) => void;
  selectedRoomName?: string | null;
  roomCounts?: Record<string, number>;
  className?: string;
  isPopup?: boolean;
}

// ─── 3D Orbit Constants ────────────────────────────────────────────

const ORBIT_PITCH = 60;
const ORBIT_BEARING_SPEED = 0.3;
const RETURN_DURATION = 2000;

// ─── Error Fallback UI ──────────────────────────────────────────────

function MapErrorFallback() {
  return (
    <div
      data-testid="campus-map-error"
      className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 text-slate-500"
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p className="text-sm font-medium">지도를 불러올 수 없습니다</p>
      </div>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[CampusMapWrapper] Map failed to render:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <MapErrorFallback />;
    }
    return this.props.children;
  }
}

// ─── Dynamic import (SSR disabled — WebGL requires browser) ────────

const MapLibreCampusOverlay = dynamic(
  () =>
    import("school-floor-map/overlays/maplibre").then(
      (mod) => mod.MapLibreCampusOverlay,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="campus-map-loading"
        className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100"
      >
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm font-medium">지도를 불러오는 중...</p>
        </div>
      </div>
    ),
  },
);

// ─── Component ─────────────────────────────────────────────────────

export function CampusMapWrapper({
  selectedLevel,
  onLevelChange,
  onRoomSelect,
  selectedRoomName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  roomCounts: _roomCounts,
  className,
  isPopup,
}: CampusMapWrapperProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const rafRef = useRef<number>(0);
  const [orbiting, setOrbiting] = useState(false);

  const stopOrbit = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const startOrbit = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const zoom = Math.max(map.getZoom(), 17);

    map.easeTo({
      center,
      zoom,
      pitch: ORBIT_PITCH,
      bearing: map.getBearing(),
      duration: 1200,
      easing: (t) => t * (2 - t),
    });

    const tick = () => {
      const m = mapRef.current;
      if (!m) return;
      m.easeTo({
        bearing: m.getBearing() + ORBIT_BEARING_SPEED,
        duration: 0,
        easing: (t) => t,
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 1200);
  }, []);

  const stopAndReturnFlat = useCallback(() => {
    stopOrbit();
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: RETURN_DURATION,
      easing: (t) => t * (2 - t),
    });
  }, [stopOrbit]);

  useEffect(() => {
    return () => stopOrbit();
  }, [stopOrbit]);

  const toggleOrbit = useCallback(() => {
    if (orbiting) {
      stopAndReturnFlat();
      setOrbiting(false);
    } else {
      startOrbit();
      setOrbiting(true);
    }
  }, [orbiting, startOrbit, stopAndReturnFlat]);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
  }, []);

  const handleFeatureSelect = useCallback(
    (feature: unknown, context: unknown) => {
      const props = (feature as { properties?: Record<string, unknown> })
        .properties;
      const ctx = context as { levelId?: string };

      if (!props || props.interactive !== true || !props.category) {
        return;
      }

      const roomName = (props.name_ko as string) || (props.name as string);
      if (!roomName) return;

      const levelId = ctx?.levelId ?? "";
      onRoomSelect?.(roomName, levelId);
    },
    [onRoomSelect],
  );

  return (
    <div data-testid="campus-map" className={cn("relative h-full w-full", className)}>
      <MapErrorBoundary>
        <MapLibreCampusOverlay
          data={campusWgs84FeatureCollection}
          selectedLevel={selectedLevel}
          onLevelChange={onLevelChange}
          onFeatureSelect={handleFeatureSelect}
          showLegend={false}
          rasterStyle="osm"
          selectedRoomName={selectedRoomName}
          schoolOutline={schoolOutlineFeatureCollection}
          onMapReady={handleMapReady}
          isPopup={isPopup}
          className="h-full w-full"
        />
      </MapErrorBoundary>

      <button
        type="button"
        data-testid="orbit-toggle"
        onClick={toggleOrbit}
        aria-label={orbiting ? "3D 회전 정지" : "3D 회전 시작"}
        className={[
          "absolute right-3 bottom-3 z-10",
          "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md",
          "transition-all duration-200 hover:shadow-lg active:scale-95",
          orbiting ? "text-blue-600 ring-2 ring-blue-400" : "text-slate-600",
        ].join(" ")}
      >
        <RotateCcw
          className={`h-4 w-4 ${orbiting ? "animate-spin" : ""}`}
          style={orbiting ? { animationDuration: "2s" } : undefined}
        />
      </button>
    </div>
  );
}

export default CampusMapWrapper;
