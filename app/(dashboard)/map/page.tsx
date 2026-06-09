"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Layers, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import { CampusMapWrapper } from "@/components/map/CampusMapWrapper";

interface RoomItem {
  id: string;
  name: string;
  category: string;
  specification: string | null;
  productNumber: string;
  quantity: number;
  acquisitionDate: string;
  storageLocation: string;
  photoUrl: string | null;
  status: string;
}

interface MapCountRoom {
  roomName: string;
  count: number;
  items: RoomItem[];
}

interface MapCountResponse {
  rooms: MapCountRoom[];
}

export default function MapPage() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>("1");
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [roomItemsMap, setRoomItemsMap] = useState<Record<string, RoomItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMapCounts() {
      try {
        const res = await fetch("/api/products/map-counts");
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: MapCountResponse = await res.json();

        if (cancelled) return;

        const counts: Record<string, number> = {};
        const items: Record<string, RoomItem[]> = {};
        for (const room of data.rooms) {
          counts[room.roomName] = room.count;
          items[room.roomName] = room.items;
        }

        setRoomCounts(counts);
        setRoomItemsMap(items);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load map counts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMapCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRoomSelect = useCallback((roomName: string) => {
    setSelectedRoom(roomName);
  }, []);

  const currentItems = selectedRoom ? (roomItemsMap[selectedRoom] ?? []) : [];

  return (
    <div
      data-testid="map-page"
      className="flex h-[calc(100vh-4rem)] flex-col md:h-screen md:flex-row md:gap-4"
    >
      {/* ── Map Area ── */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <CampusMapWrapper
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          onRoomSelect={handleRoomSelect}
          selectedRoomName={selectedRoom}
          roomCounts={roomCounts}
          className="rounded-2xl"
        />
      </div>

      {/* ── Room Detail Panel ── */}
      <div className="mt-4 flex w-full flex-col rounded-2xl border border-slate-200 bg-white md:mt-0 md:w-80 lg:w-96">
        {/* Panel header */}
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-4 w-4 text-slate-500" />
            실 정보
          </h2>
        </div>

        {/* Detail content */}
        <div data-testid="map-room-detail" className="flex-1 overflow-y-auto p-4">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Loaded content */}
          {!loading && !error && (
            <>
              {/* Selected room name */}
              {selectedRoom ? (
                <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">선택된 실</p>
                  <p className="text-base font-semibold">{selectedRoom}</p>
                </div>
              ) : (
                <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-400">방을 선택해주세요</p>
                </div>
              )}

              {/* Count badge */}
              {selectedRoom ? (
                <div
                  data-testid="map-count-badge"
                  className="mb-4 rounded-xl bg-blue-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-blue-700">
                    {(roomCounts[selectedRoom] ?? 0)}개 물품
                  </p>
                </div>
              ) : Object.keys(roomCounts).length > 0 ? null : (
                <div
                  data-testid="map-count-badge"
                  className="hidden"
                  aria-hidden="true"
                />
              )}

              {/* Room items list */}
              <div data-testid="map-room-items">
                {selectedRoom && currentItems.length > 0 ? (
                  <ul className="space-y-3">
                    {currentItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/products/${item.id}`}
                          className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          {/* ── Thumbnail + Header Row ── */}
                          <div className="flex gap-3 p-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                              {item.photoUrl ? (
                                <Image
                                  src={item.photoUrl}
                                  alt={`${item.name} 사진`}
                                  width={56}
                                  height={56}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-slate-400" aria-hidden="true" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-slate-950 group-hover:underline">
                                  {item.name}
                                </p>
                                <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                                  {item.quantity}개
                                </span>
                              </div>

                              {item.specification && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {item.specification}
                                </p>
                              )}

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                                  <Tag className="h-3 w-3" />
                                  {item.category}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(item.acquisitionDate), "yy.MM.dd")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* ── Footer: product number ── */}
                          <div className="border-t border-slate-100 px-3 py-1.5">
                            <p className="font-mono text-xs text-slate-400">
                              {item.productNumber}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : selectedRoom && currentItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Package className="mb-2 h-8 w-8" />
                    <p className="text-center text-sm">
                      이 방에 등록된 물품이 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Package className="mb-2 h-8 w-8" />
                    <p className="text-center text-sm">
                      선택한 방의 물품이 여기에 표시됩니다
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
