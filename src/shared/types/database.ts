import { UserRole, TransactionType, SerialStatus } from "./enums";

/**
 * 사용자 (users 테이블)
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

/**
 * 창고 (warehouses 테이블)
 */
export interface Warehouse {
  id: string;
  name: string;
  created_at: string;
}

/**
 * 물품 (items 테이블)
 */
export interface Item {
  id: string;
  name: string;
  category: string;
  barcode?: string;
  image_url?: string;
  production_year?: number;
  service_life?: number;
  has_serial_number: boolean;
  has_service_life: boolean;
  min_stock: number;
  created_at: string;
}

/**
 * 물품 시리얼 번호 (item_serials 테이블)
 */
export interface ItemSerial {
  id: string;
  item_id: string;
  serial_number: string;
  warehouse_id?: string;
  status: SerialStatus;
  created_at: string;
}

/**
 * 재고 (inventory 테이블)
 */
export interface Inventory {
  id: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  updated_at: string;
}

/**
 * 거래 기록 (transactions 테이블)
 */
export interface Transaction {
  id: string;
  item_id: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  user_id?: string;
  quantity: number;
  type: TransactionType;
  reason?: string;
  created_at: string;
}

/**
 * 재고 상세 정보 (items + inventory + warehouses 조인)
 */
export interface InventoryDetail extends Inventory {
  item_name: string;
  item_category: string;
  item_min: number;
  item_has_serial: boolean;
  warehouse_name: string;
  image_url?: string;
}

/**
 * 거래 상세 정보 (transactions + items + users + warehouses 조인)
 */
export interface TransactionDetail extends Transaction {
  item_name: string;
  item_category: string;
  user_email?: string;
  user_name?: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
}

/**
 * 물품 시리얼 상세 정보 (item_serials + items + warehouses 조인)
 */
export interface ItemSerialDetail extends ItemSerial {
  item_name: string;
  item_category: string;
  warehouse_name?: string;
}
