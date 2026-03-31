require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: items } = await supabase.from("items").select("name");
  const names = items.map(i => i.name);
  const duplicates = names.filter((e, i, a) => a.indexOf(e) !== i);
  console.log("Duplicates:", new Set(duplicates));
}
check();
