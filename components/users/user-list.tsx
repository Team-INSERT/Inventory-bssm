import { format } from "date-fns"
import { Pencil, Trash2, RefreshCw } from "lucide-react"

export type UserRecord = {
  id: number
  pin: string
  name: string
  role: "ADMIN" | "USER"
  email: string | null
  isActive: boolean
  createdAt: string
}

type Props = {
  users: UserRecord[]
  loading: boolean
  error: string
  onEdit: (user: UserRecord) => void
  onDeactivate: (user: UserRecord) => void
  busyUserId?: number | null
}

function roleLabel(role: UserRecord["role"]) {
  return role === "ADMIN" ? "관리자" : "사용자"
}

function roleBadgeClass(role: UserRecord["role"]) {
  return role === "ADMIN"
    ? "border-slate-900 bg-slate-900 text-white"
    : "border-slate-200 bg-slate-100 text-slate-700"
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500"
}

export function UserList({ users, loading, error, onEdit, onDeactivate, busyUserId }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">사용자 목록</h3>
            <p className="mt-1 text-sm text-slate-600">PIN, 역할, 상태를 한 번에 관리합니다.</p>
          </div>
          <div className="text-sm text-slate-500">활성 사용자 {users.length}명</div>
        </div>
      </div>

      {error ? (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[760px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                PIN
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                상태
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 sm:table-cell">
                생성일
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-5" colSpan={6}>
                    <div className="grid grid-cols-6 gap-4">
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 rounded bg-slate-200" />
                      <div className="h-4 rounded bg-slate-200" />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-16 text-center" colSpan={6}>
                  <div className="mx-auto max-w-sm">
                    <p className="text-sm font-medium text-slate-950">등록된 사용자가 없습니다.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      상단의 <span className="font-medium text-slate-900">사용자 추가</span> 버튼으로 첫 사용자를 만들어보세요.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onEdit(user)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.pin}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email || "이메일 없음"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${roleBadgeClass(user.role)}`}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(user.isActive)}`}
                    >
                      {user.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-slate-600 sm:table-cell">
                    {format(new Date(user.createdAt), "yyyy.MM.dd HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit(user)
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:px-3"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">수정</span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeactivate(user)
                        }}
                        disabled={busyUserId === user.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-2 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                      >
                        {busyUserId === user.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">비활성화</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
