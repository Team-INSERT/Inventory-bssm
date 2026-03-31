import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.TEMP_ADMIN_EMAIL || "admin@example.com";
const password = process.env.TEMP_ADMIN_PASSWORD || "246810";
const fullName = process.env.TEMP_ADMIN_NAME || "임시 관리자";
const phoneNumber = process.env.TEMP_ADMIN_PHONE || "010-0000-0000";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTempAdmin() {
  const { data: existingProfile } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  const existingAuthUser = userList.users.find((user) => user.email === email);

  if (existingProfile) {
    const { error: roleError } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("id", existingProfile.id);

    if (roleError) {
      throw roleError;
    }

    if (existingAuthUser) {
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password,
          user_metadata: {
            ...existingAuthUser.user_metadata,
            role: "admin",
          },
        },
      );

      if (metadataError) {
        throw metadataError;
      }
    }

    console.log(`기존 계정을 관리자 권한으로 맞췄습니다: ${email}`);
    return;
  }

  if (existingAuthUser) {
    const { error: insertError } = await supabase.from("users").insert({
      id: existingAuthUser.id,
      email,
      full_name: existingAuthUser.user_metadata?.full_name || fullName,
      username: email.split("@")[0],
      phone_number: existingAuthUser.user_metadata?.phone_number || phoneNumber,
      role: "admin",
    });

    if (insertError) {
      throw insertError;
    }

    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password,
        user_metadata: {
          ...existingAuthUser.user_metadata,
          role: "admin",
        },
      },
    );

    if (metadataError) {
      throw metadataError;
    }

    console.log(`기존 인증 계정을 관리자 권한으로 연결했습니다: ${email}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username: email.split("@")[0],
      phone_number: phoneNumber,
      role: "admin",
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("관리자 계정 생성에 실패했습니다.");
  }

  const { error: roleError } = await supabase
    .from("users")
    .update({ role: "admin" })
    .eq("id", data.user.id);

  if (roleError) {
    throw roleError;
  }

  const { error: metadataError } = await supabase.auth.admin.updateUserById(
    data.user.id,
    {
      user_metadata: {
        ...data.user.user_metadata,
        role: "admin",
      },
    },
  );

  if (metadataError) {
    throw metadataError;
  }

  console.log("임시 관리자 계정을 생성했습니다.");
  console.log(`email: ${email}`);
  console.log(`password/pin: ${password}`);
}

createTempAdmin().catch((error) => {
  console.error("임시 관리자 계정 생성 실패:", error);
  process.exit(1);
});
