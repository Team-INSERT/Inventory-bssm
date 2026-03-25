/**
 * 사용자 역할 enum
 */
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

/**
 * 거래 타입 enum
 */
export enum TransactionType {
  IN = "IN",
  OUT = "OUT",
  TRANSFER = "TRANSFER",
  DISPOSE = "DISPOSE",
}

/**
 * 시리얼 번호 상태 enum
 */
export enum SerialStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  DISPOSED = "DISPOSED",
}
