import { Item, Warehouse, ItemSerial, Inventory } from "./database";

/**
 * 인벤토리 그리드 아이템
 */
export interface InventoryGridItem {
  item_id: string;
  warehouse_id: string;
  quantity: number;
  item_name: string;
  item_category: string;
  item_min: number;
  warehouse_name: string;
  image_url?: string;
  has_serial_number?: boolean;
}

/**
 * 조정 중인 아이템 상태
 */
export interface AdjustingItem {
  item_id: string;
  warehouse_id: string;
  name: string;
  has_serial_number?: boolean;
}

/**
 * 재고 조정 모달 상태
 */
export interface AdjustmentModalState {
  quantity: number;
  serial_id: string;
  reason: string;
  isDisposal: boolean;
  type: "IN" | "OUT";
}

/**
 * 사용 가능한 시리얼 항목
 */
export interface AvailableSerial {
  id: string;
  serial_number: string;
}

/**
 * Select/Dropdown 옵션
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  colorClass?: string;
  disabled?: boolean;
}

/**
 * 페이지네이션 상태
 */
export interface PaginationState {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
}

/**
 * 테이블 헤더 설정
 */
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

/**
 * 모달 상태
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * 폼 필드 에러
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * 폼 상태
 */
export interface FormState<T> {
  values: T;
  errors: FormError[];
  isSubmitting: boolean;
  isValid: boolean;
}
