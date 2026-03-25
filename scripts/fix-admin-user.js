/**
 * Fix admin user role in database
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

async function fixAdminUser() {
  try {
    console.log("🔧 Fixing admin user role...\n");

    // Update admin user
    const { data, error } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("email", "admin@bsm.hs.kr");

    if (error) {
      throw error;
    }

    console.log("✅ Admin user role updated successfully");
    console.log(`   Rows affected: ${data?.length || 0}\n`);

    // Verify
    const { data: adminUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@bsm.hs.kr")
      .single();

    console.log("📋 Admin user details:");
    console.log(`   Email: ${adminUser?.email}`);
    console.log(`   Role: ${adminUser?.role}`);
    console.log(`   ID: ${adminUser?.id}`);

    // Also update metadata for this user
    const adminClient = supabase;
    await adminClient.auth.admin.updateUserById(adminUser.id, {
      user_metadata: {
        role: "admin",
      },
    });

    console.log("\n✅ Admin metadata updated!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixAdminUser();
