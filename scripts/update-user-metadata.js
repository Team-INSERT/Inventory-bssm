/**
 * Update user metadata with role information
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

async function updateUserMetadata() {
  try {
    console.log("📝 Updating user metadata with role information...\n");

    // Get all users from database
    const adminClient = supabase;
    const { data: users, error } = await adminClient
      .from("users")
      .select("id, role");

    if (error) {
      throw error;
    }

    for (const user of users) {
      console.log(`👤 Updating user ${user.id} with role: ${user.role}`);

      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            role: user.role,
          },
        });

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully\n`);
      }
    }

    console.log("🎉 User metadata update completed!");
  } catch (error) {
    console.error("❌ Error updating user metadata:", error);
    process.exit(1);
  }
}

updateUserMetadata();
