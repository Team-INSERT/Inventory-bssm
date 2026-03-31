import { format } from "date-fns";
import { Users, KeyRound } from "lucide-react";

import { getSupabaseAdminClient } from "@/shared/api/supabase/server";

import { UserCreateForm } from "./user-create-form";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await getSupabaseAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, phone_number, role, created_at")
    .order("created_at", { ascending: false });

  const managedUsers = users?.filter((user) => user.role !== "admin") ?? [];
  const adminUsers = users?.filter((user) => user.role === "admin") ?? [];

  return (
    <div className="space-y-8 pb-32 sm:pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
          유저 관리
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          공개 회원가입은 비활성화되어 있습니다. 관리자만 일반 사용자 계정을
          발급할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <UserCreateForm />

        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                계정 현황
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                관리자 {adminUsers.length}명, 일반 사용자 {managedUsers.length}명
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            로그인은 이메일 + 초기 PIN 조합으로 진행합니다. PIN은 생성 시점에만
            확인 가능하므로 사용자에게 따로 전달해야 합니다.
          </div>

          <div className="mt-5 space-y-3">
            {managedUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-black/5 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                      {user.full_name || "이름 없음"}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {user.phone_number || "전화번호 없음"}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                    user
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-gray-500">
                  <KeyRound className="h-3.5 w-3.5" />
                  생성일 {format(new Date(user.created_at), "yyyy.MM.dd HH:mm")}
                </div>
              </div>
            ))}

            {managedUsers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-zinc-800 dark:text-gray-400">
                아직 생성된 일반 사용자 계정이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
