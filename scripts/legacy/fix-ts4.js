const fs = require('fs');
const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/const \{ data: items \} = .*$/m, 'const { data: items } = await supabase.from("items").select("*").order("name");');
code = code.replace(/const \{ data: warehouses \} = .*$/m, 'const { data: warehouses } = await supabase.from("warehouses").select("*").order("name");');
code = code.replace(/const \{ data: inventory \} = .*$/m, 'const { data: inventory } = await supabase.from("inventory").select("*");');
code = code.replace(/const \{ data: itemSerials \} = .*$/m, 'const { data: itemSerials } = await supabase.from("item_serials").select("*");');
fs.writeFileSync(path, code);
