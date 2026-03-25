require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ezdxnhglpbrjugxeafzo.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reset() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    "76e33476-dc92-415c-9b94-9ad6b8588d09", // admin ID
    { password: "admin@1234", email_confirm: true }
  );
  if (error) console.error(error);
  else console.log("Password reset successfully!", data.user.email);
}
reset();
