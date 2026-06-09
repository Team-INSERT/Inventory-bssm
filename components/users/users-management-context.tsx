"use client"

import { createContext, useContext } from "react"

export type UsersManagementSubmitPayload =
  | {
      mode: "create"
      pin: string
      name: string
      role: "ADMIN" | "USER"
      email: string | null
      password: string | null
    }
  | {
      mode: "edit"
      id: number
      pin: string
      name: string
      role: "ADMIN" | "USER"
      email: string | null
      password: string | null
      isActive: boolean
    }

type UsersManagementActions = {
  onClose: () => void
  onSubmit: (
    payload: UsersManagementSubmitPayload,
  ) => Promise<{
    ok: boolean
    message?: string
    formErrors?: string[]
    fieldErrors?: Partial<Record<"pin" | "name" | "role" | "email" | "password" | "isActive", string>>
  }>
}

const UsersManagementContext = createContext<UsersManagementActions | null>(null)

export function UsersManagementActionsProvider({
  value,
  children,
}: {
  value: UsersManagementActions
  children: React.ReactNode
}) {
  return <UsersManagementContext.Provider value={value}>{children}</UsersManagementContext.Provider>
}

export function useUsersManagementActions() {
  const context = useContext(UsersManagementContext)

  if (!context) {
    throw new Error("useUsersManagementActions must be used within UsersManagementActionsProvider")
  }

  return context
}
