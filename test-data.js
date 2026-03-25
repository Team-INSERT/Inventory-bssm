require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: { session }, error: authErr } = await supabase.auth.signInWithPassword({
    email: "user@bsm.hs.kr",
    password: "user@1234"
  });
  if (authErr) { console.error("Auth err:", authErr.message); return; }
  
  const { data: items, error: e3 } = await supabase.from("items").select("*");
  console.log("items for normal user:", items?.length, e3);
}
test();
