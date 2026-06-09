"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { UserFormModal } from "./user-form-modal"
import { UserList, type UserRecord } from "./user-list"
import { UsersManagementActionsProvider } from "./users-management-context"

type Mode = "create" | "edit"

type ErrorField = "pin" | "name" | "role" | "email" | "password" | "isActive"

type SubmitErrorResult = {
  ok: false
  message: string
  formErrors?: string[]
  fieldErrors?: Partial<Record<ErrorField, string>>
}

type SubmitOutcome = { ok: true } | SubmitErrorResult

type FormPayload =
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

type ValidationDetails = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[] | undefined>
}

function firstMessage(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value
  }

  if (Array.isArray(value)) {
    const message = value.find((entry) => typeof entry === "string" && entry.trim())
    return typeof message === "string" ? message : ""
  }

  return ""
}

function normalizeApiMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as { message?: unknown; error?: unknown; details?: ValidationDetails }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message
    }
    if (record.error === "DUPLICATE_PIN") {
      return "이미 사용 중인 PIN 번호입니다."
    }
    if (record.error === "ADMIN_CREDENTIALS_REQUIRED") {
      return "관리자 계정에는 이메일과 비밀번호가 필요합니다."
    }
    if (record.error === "LAST_ADMIN") {
      return "최소 1명의 관리자가 필요합니다."
    }
    if (record.error === "VALIDATION_ERROR") {
      const details = record.details
      const fieldMessages = details?.fieldErrors
        ? Object.values(details.fieldErrors).flatMap((messages) => messages ?? [])
        : []
      const detailMessage =
        details?.formErrors?.find((message) => message.trim()) ??
        fieldMessages.find((message) => message.trim()) ??
        ""

      if (detailMessage) {
        return detailMessage
      }

      return "입력값을 다시 확인하세요."
    }
  }

  return fallback
}

function normalizeValidationDetails(payload: unknown): Pick<SubmitErrorResult, "formErrors" | "fieldErrors"> | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const record = payload as { error?: unknown; details?: ValidationDetails }

  if (record.error !== "VALIDATION_ERROR" || !record.details) {
    return null
  }

  const fieldErrors = Object.entries(record.details.fieldErrors ?? {}).reduce((accumulator, [key, value]) => {
    const message = firstMessage(value)

    if (message) {
      accumulator[key as ErrorField] = message
    }

    return accumulator
  }, {} as Partial<Record<ErrorField, string>>)

  const formErrors = (record.details.formErrors ?? []).filter(
    (message): message is string => typeof message === "string" && message.trim().length > 0,
  )

  return {
    formErrors: formErrors.length > 0 ? formErrors : undefined,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  }
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [tableError, setTableError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("create")
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [busyUserId, setBusyUserId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      setTableError("")
      const response = await fetch("/api/users", { cache: "no-store" })

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      if (response.status === 403) {
        window.location.href = "/products"
        return
      }

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(normalizeApiMessage(payload, "사용자 목록을 불러오지 못했습니다."))
      }

      setUsers(payload.data)
    } catch (error) {
      setTableError(error instanceof Error ? error.message : "사용자 목록을 불러오지 못했습니다.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function openCreateModal() {
    setMode("create")
    setSelectedUser(null)
    setModalOpen(true)
  }

  function openEditModal(user: UserRecord) {
    setMode("edit")
    setSelectedUser(user)
    setModalOpen(true)
  }

  function closeModal() {
    if (modalLoading) {
      return
    }

    setModalOpen(false)
    setSelectedUser(null)
  }

  async function submitUser(payload: FormPayload): Promise<SubmitOutcome> {
    setModalLoading(true)
    setActionMessage(null)

    try {
      const response =
        payload.mode === "create"
          ? await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pin: payload.pin,
                name: payload.name,
                role: payload.role,
                email: payload.email,
                password: payload.password,
              }),
            })
          : await fetch(`/api/users/${payload.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pin: payload.pin,
                name: payload.name,
                role: payload.role,
                email: payload.email,
                password: payload.password,
                isActive: payload.isActive,
              }),
            })

      const body = await response.json().catch(() => null)

      if (!response.ok || !body?.success) {
        const validationDetails = normalizeValidationDetails(body)
        const errorCode = typeof body?.error === "string" ? body.error : ""
        const baseMessage = normalizeApiMessage(body, "저장하지 못했습니다.")
        const message = validationDetails?.formErrors?.[0] || baseMessage
        const fieldErrors: Partial<Record<ErrorField, string>> = {
          ...(validationDetails?.fieldErrors ?? {}),
        }

        if (errorCode === "DUPLICATE_PIN") {
          fieldErrors.pin = "이미 사용 중인 PIN 번호입니다."
        }

        if (errorCode === "ADMIN_CREDENTIALS_REQUIRED") {
          fieldErrors.email = "관리자 계정에는 이메일과 비밀번호가 필요합니다."
          fieldErrors.password = "관리자 계정에는 이메일과 비밀번호가 필요합니다."
        }

        return {
          ok: false,
          message,
          ...(validationDetails?.formErrors ? { formErrors: validationDetails.formErrors } : {}),
          ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
        }
      }

      setActionMessage({
        type: "success",
        text: payload.mode === "create" ? "사용자를 추가했습니다." : "사용자 정보를 저장했습니다.",
      })
      setModalOpen(false)
      setSelectedUser(null)
      setRefreshing(true)
      await loadUsers()
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "저장하지 못했습니다.",
      }
    } finally {
      setModalLoading(false)
    }
  }

  async function deactivateUser(user: UserRecord) {
    const confirmed = window.confirm(`정말 ${user.name} 사용자를 비활성화하시겠습니까?`)
    if (!confirmed) {
      return
    }

    setBusyUserId(user.id)
    setActionMessage(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })
      const body = await response.json()

      if (!response.ok || !body.success) {
        throw new Error(normalizeApiMessage(body, "사용자를 비활성화하지 못했습니다."))
      }

      setActionMessage({ type: "success", text: "사용자를 비활성화했습니다." })
      setRefreshing(true)
      await loadUsers()
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "사용자를 비활성화하지 못했습니다.",
      })
    } finally {
      setBusyUserId(null)
    }
  }

  function refreshList() {
    setRefreshing(true)
    void loadUsers()
  }

  return (
    <UsersManagementActionsProvider value={{ onClose: closeModal, onSubmit: submitUser }}>
      <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">User Admin</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">사용자 관리</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              PIN, 역할, 상태를 관리하고 비활성화된 계정은 목록에서 숨깁니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refreshList}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              사용자 추가
            </button>
          </div>
        </div>

        {actionMessage ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              actionMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="status"
          >
            {actionMessage.text}
          </div>
        ) : null}
      </div>

      <UserList
        users={users}
        loading={loading}
        error={tableError}
        onEdit={openEditModal}
        onDeactivate={deactivateUser}
        busyUserId={busyUserId}
      />

        <UserFormModal open={modalOpen} mode={mode} user={selectedUser} loading={modalLoading} />
      </div>
    </UsersManagementActionsProvider>
  )
}
