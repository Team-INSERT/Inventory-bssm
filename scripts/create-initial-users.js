/**
 * Create Initial Admin and User Accounts
 * Run with: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-initial-users.js
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const SUPABASE_URL = "https://ezdxnhglpbrjugxeafzo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const initialUsers = [
  {
    email: "admin@bsm.hs.kr",
    password: "admin@1234",
    username: "admin",
    full_name: "테스트 관리자",
    phone_number: "010-0000-0001",
    role: "admin",
  },
  {
    email: "user@bsm.hs.kr",
    password: "user@1234",
    username: "user",
    full_name: "테스트 사용자",
    phone_number: "010-0000-0002",
    role: "user",
  },
];

async function createInitialUsers() {
  try {
    console.log("🌱 Creating initial users...\n");

    for (const userData of initialUsers) {
      console.log(`👤 Creating ${userData.role} account: ${userData.email}`);

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
            username: userData.username,
            phone_number: userData.phone_number,
          },
        });

      if (authError) {
        // If user already exists, try to get them
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("already exists") ||
          authError.code === "email_exists"
        ) {
          console.log(
            `   ⚠️  User already exists, skipping auth creation...\n`,
          );
          // Still need to check if profile exists
          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", userData.email)
            .single();

          if (!existingUser) {
            // Need to get the user ID from auth
            const { data: userList } = await supabase.auth.admin.listUsers();
            const authUser = userList?.users?.find(
              (u) => u.email === userData.email,
            );
            if (authUser) {
              const { error: profileError } = await supabase
                .from("users")
                .insert({
                  id: authUser.id,
                  email: userData.email,
                  full_name: userData.full_name,
                  username: userData.username,
                  phone_number: userData.phone_number,
                  role: userData.role,
                });
              if (profileError && !profileError.message.includes("duplicate")) {
                throw profileError;
              }
            }
          }
          continue;
        }
        throw authError;
      }

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        username: userData.username,
        phone_number: userData.phone_number,
        role: userData.role,
      });

      if (profileError) {
        // If profile already exists, skip
        if (!profileError.message.includes("duplicate")) {
          throw profileError;
        }
      }

      console.log(`   ✅ ${userData.role.toUpperCase()} created successfully`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔐 Password: ${userData.password}`);
      console.log(`   👤 Username: ${userData.username}\n`);
    }

    console.log("🎉 Initial users created successfully!\n");
    console.log("📝 Account Information:");
    initialUsers.forEach((user) => {
      console.log(`\n[${user.role.toUpperCase()}]`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}`);
    });
  } catch (error) {
    console.error("❌ Error creating initial users:", error);
    process.exit(1);
  }
}

createInitialUsers();
