import {
  Item,
  Warehouse,
  ItemSerial,
  Inventory,
  Transaction,
} from "./database";
import { TransactionType, SerialStatus } from "./enums";

/**
 * API 응답 기본 포맷
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}

/**
 * 물품 생성/수정 요청
 */
export interface CreateItemRequest {
  name: string;
  category: string;
  barcode?: string;
  image_url?: string;
  production_year?: number;
  service_life?: number;
  has_serial_number?: boolean;
  has_service_life?: boolean;
  min_stock?: number;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

/**
 * 창고 생성/수정 요청
 */
export interface CreateWarehouseRequest {
  name: string;
}

export interface UpdateWarehouseRequest extends CreateWarehouseRequest {
  id: string;
}

/**
 * 시리얼 번호 생성/수정 요청
 */
export interface CreateSerialRequest {
  item_id: string;
  serial_number: string;
  warehouse_id?: string;
  status?: SerialStatus;
}

export interface UpdateSerialRequest extends Partial<CreateSerialRequest> {
  id: string;
}

/**
 * 재고 조정 요청
 */
export interface InventoryAdjustmentRequest {
  item_id: string;
  warehouse_id: string;
  type: TransactionType.IN | TransactionType.OUT;
  quantity?: number; // 수량 기반 조정
  serial_id?: string; // 시리얼 기반 조정
  reason?: string;
  is_disposal?: boolean;
}

/**
 * 재고 이동 요청
 */
export interface InventoryTransferRequest {
  item_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  reason?: string;
}

/**
 * 거래 조회 필터
 */
export interface TransactionFilter {
  item_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  user_id?: string;
  type?: TransactionType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * 재고 조회 필터
 */
export interface InventoryFilter {
  item_id?: string;
  warehouse_id?: string;
  category?: string;
  search?: string;
  low_stock_only?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 시리얼 조회 필터
 */
export interface SerialFilter {
  item_id?: string;
  warehouse_id?: string;
  status?: SerialStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * 대시보드 통계
 */
export interface DashboardStats {
  total_items: number;
  total_warehouses: number;
  total_quantity: number;
  low_stock_count: number;
  recent_transactions: Transaction[];
}
