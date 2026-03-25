const fs = require('fs');
const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/await supabase\.from\("items"\)/g, `await (await import("@/shared/api/supabase/server")).getSupabaseAdminClient().then(c => c.from("items"))`);
code = code.replace(/await supabase\.from\("warehouses"\)/g, `await (await import("@/shared/api/supabase/server")).getSupabaseAdminClient().then(c => c.from("warehouses"))`);
code = code.replace(/await supabase\.from\("inventory"\)/g, `await (await import("@/shared/api/supabase/server")).getSupabaseAdminClient().then(c => c.from("inventory"))`);
code = code.replace(/await supabase\.from\("item_serials"\)/g, `await (await import("@/shared/api/supabase/server")).getSupabaseAdminClient().then(c => c.from("item_serials"))`);

fs.writeFileSync(path, code);
