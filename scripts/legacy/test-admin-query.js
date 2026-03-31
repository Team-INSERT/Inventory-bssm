require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: { session }, error: authErr } = await supabase.auth.signInWithPassword({
    email: "admin@bsm.hs.kr",
    password: "admin@1234"
  });
  if (authErr) { console.error("Auth err:", authErr.message); return; }
  
  const { data: userData, error } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();
    
  console.log("UserData from normal client:", userData, error);
}
test();
