"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { X } from "lucide-react"
import { Dropdown } from "@/components/ui/dropdown"
import type { UserRecord } from "./user-list"
import {
  type UsersManagementSubmitPayload,
  useUsersManagementActions,
} from "./users-management-context"

type Mode = "create" | "edit"

type FieldName = "pin" | "name" | "role" | "email" | "password" | "isActive"

type FormState = {
  pin: string
  name: string
  role: "ADMIN" | "USER"
  email: string
  password: string
  isActive: boolean
}

type Props = {
  open: boolean
  mode: Mode
  user: UserRecord | null
  loading: boolean
}

const emptyForm: FormState = {
  pin: "",
  name: "",
  role: "USER",
  email: "",
  password: "",
  isActive: true,
}

function emailLooksValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function fieldInputClass(hasError: boolean) {
  return [
    "block w-full rounded-2xl bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400",
    hasError
      ? "border border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
      : "border border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10",
  ].join(" ")
}

export function UserFormModal({ open, mode, user, loading }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitError, setSubmitError] = useState("")
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})
  const { onClose, onSubmit } = useUsersManagementActions()
  const originalRole = user?.role ?? "USER"

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === "edit" && user) {
      setForm({
        pin: user.pin,
        name: user.name,
        role: user.role,
        email: user.email ?? "",
        password: "",
        isActive: user.isActive,
      })
    } else {
      setForm(emptyForm)
    }

    setSubmitError("")
    setFormErrors([])
    setFieldErrors({})
  }, [mode, open, user])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  const title = mode === "create" ? "사용자 추가" : "사용자 수정"
  const description =
    mode === "create"
      ? "새로운 사용자 계정을 등록합니다."
      : "PIN, 이름, 역할, 이메일, 비밀번호, 상태를 수정합니다."
  const isAdminEdit = mode === "edit" && originalRole === "ADMIN"
  const isAdminPromotion = mode === "edit" && originalRole !== "ADMIN" && form.role === "ADMIN"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError("")
    setFormErrors([])

    const nextFieldErrors: Partial<Record<FieldName, string>> = {}

    const pinValue = form.pin.trim()
    const name = form.name.trim()
    const email = form.email.trim()
    const password = form.password.trim()

    if (mode === "create") {
      if (!/^\d{4,6}$/.test(pinValue)) {
        nextFieldErrors.pin = "PIN은 4~6자리 숫자여야 합니다."
      }
    } else if (pinValue && !/^\d{4,6}$/.test(pinValue)) {
      nextFieldErrors.pin = "PIN은 4~6자리 숫자여야 합니다."
    }

    if (!name) {
      nextFieldErrors.name = "이름을 입력하세요."
    }

    if (email && !emailLooksValid(email)) {
      nextFieldErrors.email = "이메일 형식이 올바르지 않습니다."
    }

    if (mode === "create" && isAdmin && !email) {
      nextFieldErrors.email = "관리자 계정에는 이메일이 필요합니다."
    }

    if (isAdminPromotion && !email) {
      nextFieldErrors.email = "관리자 전환에는 이메일이 필요합니다."
    }

    if (isAdminEdit && !email) {
      nextFieldErrors.email = "기존 ADMIN 계정의 이메일은 비울 수 없습니다."
    }

    if (mode === "create" && isAdmin && !password) {
      nextFieldErrors.password = "관리자 계정에는 비밀번호가 필요합니다."
    }

    if (isAdminPromotion && !password) {
      nextFieldErrors.password = "관리자 전환에는 비밀번호가 필요합니다."
    }

    if (password && password.length < 6) {
      nextFieldErrors.password = "비밀번호는 6자 이상이어야 합니다."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    const payload: UsersManagementSubmitPayload =
      mode === "create"
        ? {
            mode,
            pin: pinValue,
            name,
            role: form.role,
            email: email || null,
            password: password || null,
          }
        : {
            mode,
            id: user?.id ?? 0,
            pin: pinValue || user?.pin || "",
            name,
            role: form.role,
            email: email || null,
            password: password || null,
            isActive: form.isActive,
          }

    const result = await onSubmit(payload)

    if (!result.ok) {
      setSubmitError(result.message || "저장하지 못했습니다.")
      setFormErrors(result.formErrors ?? [])
      setFieldErrors(result.fieldErrors ?? {})
    } else {
      setFieldErrors({})
      setFormErrors([])
    }
  }

  const isAdmin = form.role === "ADMIN"
  const showAdminCredentialNotice = (mode === "create" && isAdmin) || isAdminPromotion
  const topErrorMessage = formErrors[0] || submitError

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
      >
        <form onSubmit={handleSubmit} className="max-h-[85vh] overflow-auto">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 id="user-form-title" className="text-xl font-semibold tracking-tight text-slate-950">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {topErrorMessage ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700" role="alert">
              {topErrorMessage}
            </div>
          ) : null}

          <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="pin" className="text-sm font-medium text-slate-700">
                PIN
              </label>
              <input
                id="pin"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pin}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    pin: event.target.value.replace(/\D/g, ""),
                  }))
                  clearFieldError("pin")
                }}
                placeholder={mode === "create" ? "4~6자리 숫자" : "비워두면 현재 PIN 유지"}
                aria-invalid={Boolean(fieldErrors.pin)}
                aria-describedby={fieldErrors.pin ? "pin-error" : undefined}
                className={fieldInputClass(Boolean(fieldErrors.pin))}
              />
              <p className="text-xs leading-5 text-slate-500">
                {mode === "create" ? "4~6자리 숫자를 입력하세요." : "변경할 때만 숫자 4~6자리를 입력하세요."}
              </p>
              {fieldErrors.pin ? (
                <p id="pin-error" className="text-xs font-medium text-rose-600">
                  {fieldErrors.pin}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }))
                  clearFieldError("name")
                }}
                placeholder="사용자 이름"
                maxLength={50}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                className={fieldInputClass(Boolean(fieldErrors.name))}
              />
              {fieldErrors.name ? (
                <p id="name-error" className="text-xs font-medium text-rose-600">
                  {fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                역할
              </label>
              <Dropdown
                id="role"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value === "ADMIN" ? "ADMIN" : "USER",
                  }))
                }
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </Dropdown>
            </div>

            {mode === "edit" ? (
              <div className="space-y-2">
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  상태
                </label>
                <Dropdown
                  id="isActive"
                  value={form.isActive ? "true" : "false"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </Dropdown>
              </div>
            ) : null}

            {showAdminCredentialNotice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 sm:col-span-2">
                관리자 계정에는 이메일과 비밀번호가 필요합니다. 두 항목을 모두 입력해야 저장할 수 있습니다.
              </div>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }))
                  clearFieldError("email")
                }}
                placeholder={isAdmin ? "관리자 로그인용 이메일" : "선택 입력"}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : isAdmin ? "email-hint" : undefined}
                className={fieldInputClass(Boolean(fieldErrors.email))}
              />
                <p id="email-hint" className="text-xs leading-5 text-slate-500">
                  {isAdminEdit
                    ? "기존 관리자 계정의 이메일은 비울 수 없습니다."
                    : isAdmin
                      ? "관리자 계정은 이메일이 필요합니다."
                      : "선택 입력"}
                </p>
              {fieldErrors.email ? (
                <p id="email-error" className="text-xs font-medium text-rose-600">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            {mode === "edit" || isAdmin ? (
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  비밀번호 {showAdminCredentialNotice ? "(필수)" : "(선택)"}
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, password: event.target.value }))
                    clearFieldError("password")
                  }}
                  placeholder={showAdminCredentialNotice ? "관리자 로그인용 비밀번호" : "변경 시에만 입력"}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={fieldInputClass(Boolean(fieldErrors.password))}
                />
                <p className="text-xs leading-5 text-slate-500">
                  {showAdminCredentialNotice
                    ? "관리자 계정 등록 또는 전환 시에는 비밀번호가 필요합니다."
                    : isAdminEdit
                      ? "기존 관리자 계정은 비밀번호를 변경할 때만 입력하세요."
                      : "변경할 때만 입력하세요."}
                </p>
                {fieldErrors.password ? (
                  <p id="password-error" className="text-xs font-medium text-rose-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "저장 중..." : mode === "create" ? "추가하기" : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
