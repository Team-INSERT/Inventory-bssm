const fs = require('fs');
const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const \{ data: itemSerials \} = await supabase\.from\("item_serials"\)\.select\("\*"\);([\s\S]*?)if \(\!acc\[item\.category\]\)/m, 'const { data: itemSerials } = await supabase.from("item_serials").select("*");\n  const groupedItems = (items || []).reduce((acc: any, item: any) => {\n    if (!acc[item.category])');

fs.writeFileSync(path, code);
