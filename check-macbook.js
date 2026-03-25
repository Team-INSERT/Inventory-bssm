require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: items } = await supabase.from("items").select("*").ilike("name", "%맥북%");
  console.log("Items:");
  console.dir(items, { depth: null });
  
  const { data: serials } = await supabase.from("item_serials").select("*");
  console.log("Serials count:", serials?.length);
}
check();
