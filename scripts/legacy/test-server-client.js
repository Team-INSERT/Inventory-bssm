require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: items, error } = await supabase.from("items").select("*");
  console.log("Items count (SERVICE_ROLE):", items?.length, "Error:", error);
}
check();
