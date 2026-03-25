require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: items, error } = await supabase.from("items").select("*");
  console.log("Items count:", items?.length, "Error:", error);
  if (items?.length > 0) {
    console.log("Sample item:", items[0].name, items[0].category);
  }
}
check();
