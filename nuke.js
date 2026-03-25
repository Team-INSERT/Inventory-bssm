require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deleteAll(table) {
  const { data } = await supabase.from(table).select('id');
  if (data && data.length > 0) {
    const ids = data.map(d => d.id);
    const { error } = await supabase.from(table).delete().in('id', ids);
    if (!error) console.log(`Deleted ${ids.length} rows from ${table}`);
  }
}

async function nuke() {
  await deleteAll("transactions");
  await deleteAll("item_serials");
  await deleteAll("inventory");
  await deleteAll("items");
  await deleteAll("warehouses");
  console.log("Done nuking.");
}
nuke();
