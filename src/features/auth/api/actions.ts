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
  let { data: userData, error: userError } = await adminClient
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

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

    userData = { role: "user" };
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
      role: userData?.role,
    },
  });

  revalidatePath("/", "layout");

  // 역할에 따라 다른 페이지로 리다이렉트
  const userRole = userData?.role;
  if (userRole === "admin") {
    redirect("/admin");
  } else {
    redirect("/");
  }
}

export async function signup(data: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}) {
  try {
    const adminClient = await getSupabaseAdminClient();

    // Create auth user
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
          username: data.username,
          phone_number: data.phoneNumber,
          role: "user",
        },
      });

    if (authError) {
      return { error: authError.message };
    }

    // Create user profile
    const { error: profileError } = await adminClient.from("users").insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      username: data.username,
      phone_number: data.phoneNumber,
      role: "user",
    });

    if (profileError) {
      return { error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "회원가입 중 오류가 발생했습니다.",
    };
  }
}

export async function logout() {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
