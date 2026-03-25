/**
 * Diagnose admin user status
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

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

async function diagnoseAdmin() {
  try {
    console.log("🔍 Diagnosing admin user...\n");

    // Check auth user
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const adminAuthUser = authUsers?.users?.find(
      (u) => u.email === "admin@bsm.hs.kr",
    );

    if (!adminAuthUser) {
      console.log("❌ Admin auth user NOT found in auth.users");
      console.log("\n📝 Creating admin auth user...");

      const { data: newAuthUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: "admin@bsm.hs.kr",
          password: "admin@1234",
          email_confirm: true,
          user_metadata: {
            full_name: "테스트 관리자",
            username: "admin",
            phone_number: "010-0000-0001",
            role: "admin",
          },
        });

      if (authError) {
        console.log(`   ⚠️  Error: ${authError.message}`);
        if (authError.code !== "email_exists") {
          throw authError;
        }
      } else {
        console.log(`   ✅ Created: ${newAuthUser?.user?.id}`);
      }
    } else {
      console.log("✅ Admin auth user found");
      console.log(`   ID: ${adminAuthUser.id}`);
      console.log(`   Email: ${adminAuthUser.email}`);
      console.log(
        `   Email confirmed: ${adminAuthUser.email_confirmed_at ? "Yes" : "No"}`,
      );
      console.log(`   Created: ${adminAuthUser.created_at}`);
    }

    // Check database user
    const { data: dbUsers, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@bsm.hs.kr");

    if (dbError) {
      console.log("\n❌ Error querying users table:", dbError);
      throw dbError;
    }

    if (dbUsers && dbUsers.length === 0) {
      console.log(
        "\n❌ Admin user NOT found in users table - need to create profile",
      );

      const userId = adminAuthUser?.id;
      if (!userId) {
        throw new Error("No user ID found");
      }

      console.log("\n📝 Creating admin profile...");
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        email: "admin@bsm.hs.kr",
        full_name: "테스트 관리자",
        username: "admin",
        phone_number: "010-0000-0001",
        role: "admin",
      });

      if (insertError) {
        console.log(`   ❌ Error: ${insertError.message}`);
        throw insertError;
      } else {
        console.log(`   ✅ Created admin profile`);
      }
    } else if (dbUsers && dbUsers.length > 0) {
      const adminUser = dbUsers[0];
      console.log("\n✅ Admin user found in users table");
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Full name: ${adminUser.full_name}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Created: ${adminUser.created_at}`);

      if (adminUser.role !== "admin") {
        console.log("\n⚠️  Role is not 'admin', updating...");
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: "admin" })
          .eq("id", adminUser.id);

        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`);
          throw updateError;
        } else {
          console.log(`   ✅ Updated role to 'admin'`);
        }
      }
    }

    // Update auth metadata
    const userId = adminAuthUser?.id;
    if (userId) {
      console.log("\n📝 Updating auth metadata...");
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: "admin",
          full_name: "테스트 관리자",
          username: "admin",
          phone_number: "010-0000-0001",
        },
      });
      console.log("   ✅ Auth metadata updated");
    }

    console.log("\n✅ Admin user diagnosis complete!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

diagnoseAdmin();
