export const ROLE = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const
export type Role = (typeof ROLE)[keyof typeof ROLE]

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  DISPOSED: "DISPOSED",
} as const
export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]

export const ACTION_TYPE = {
  USE: "USE",
  MOVE: "MOVE",
  DISPOSE: "DISPOSE",
  RESTORE: "RESTORE",
  RECOVER: "RECOVER",
  ADJUST: "ADJUST",
} as const
export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE]
