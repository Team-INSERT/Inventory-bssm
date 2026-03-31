"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseClient,
  getSupabaseAdminClient,
} from "@/shared/api/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("이메일과 비밀번호를 입력해주세요.")}`,
    );
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const errorMsg = error.message.includes("Invalid login credentials")
      ? "이메일 또는 비밀번호가 일치하지 않습니다."
      : error.message.includes("Email not confirmed")
        ? "이메일 인증이 완료되지 않았습니다."
        : error.message;
    redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (!data.user) {
    redirect(
      `/login?error=${encodeURIComponent("사용자 정보를 가져올 수 없습니다.")}`,
    );
  }

  // Admin 클라이언트를 사용해서 사용자 프로필에서 역할 정보 가져오기 (RLS 정책 우회)
  const adminClient = await getSupabaseAdminClient();
  const { data: userData, error: userError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();
  let resolvedRole = userData?.role;

  // 사용자 레코드가 없으면 자동으로 생성
  if (userError && userError.code === "PGRST116") {
    // PGRST116: no rows returned
    console.log("User profile not found, creating...");
    const { error: createError } = await adminClient.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name,
      username: data.user.user_metadata?.username,
      phone_number: data.user.user_metadata?.phone_number,
      role: "user", // 기본값은 user
    });

    if (createError) {
      console.error("Failed to create user profile:", createError);
      redirect(
        `/login?error=${encodeURIComponent("사용자 프로필 생성에 실패했습니다.")}`,
      );
    }
    resolvedRole = "user";
  } else if (userError) {
    console.error("User retrieval error:", userError);
    redirect(
      `/login?error=${encodeURIComponent("사용자 정보를 조회할 수 없습니다.")}`,
    );
  }

  // auth metadata 업데이트 (미들웨어 최적화)
  await adminClient.auth.admin.updateUserById(data.user.id, {
    user_metadata: {
      ...data.user.user_metadata,
      role: resolvedRole,
    },
  });

  revalidatePath("/", "layout");

  // 역할에 따라 다른 페이지로 리다이렉트
  const userRole = resolvedRole;
  if (userRole === "admin") {
    redirect("/admin");
  } else {
    redirect("/");
  }
}

async function requireAdminAccess() {
  const supabase = await createSupabaseClient();
  const adminClient = await getSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: userData, error } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || userData?.role !== "admin") {
    throw new Error("관리자만 접근할 수 있습니다.");
  }

  return { user, adminClient };
}

export async function signup(data: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}) {
  void data;

  return {
    error: "공개 회원가입은 비활성화되어 있습니다. 관리자에게 계정 발급을 요청하세요.",
  };
}

export async function createManagedUser(data: {
  email: string;
  fullName: string;
  phoneNumber: string;
  pin: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim();
    const phoneNumber = data.phoneNumber.trim();
    const pin = data.pin.trim();

    if (!email || !fullName || !pin) {
      return { error: "필수 항목을 모두 입력해주세요." };
    }

    if (!/^\d{6}$/.test(pin)) {
      return { error: "PIN 번호는 6자리 숫자여야 합니다." };
    }

    const { adminClient } = await requireAdminAccess();

    const username = email.split("@")[0];

    const { data: existingEmail, error: emailError } = await adminClient
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailError) {
      return { error: "이메일 중복 여부를 확인할 수 없습니다." };
    }

    if (existingEmail) {
      return { error: "이미 등록된 이메일입니다." };
    }

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username,
          phone_number: phoneNumber || null,
          role: "user",
          created_by_admin: true,
        },
      });

    if (authError) {
      if (
        authError.message.includes("already registered") ||
        authError.message.includes("already been registered")
      ) {
        return { error: "이미 등록된 이메일입니다." };
      }

      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "사용자 생성에 실패했습니다." };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "사용자 생성 중 오류가 발생했습니다.",
    };
  }
}

export async function logout() {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
