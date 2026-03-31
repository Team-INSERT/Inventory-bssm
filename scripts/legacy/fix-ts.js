const fs = require('fs');

const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/await \(await import\("@\/shared\/api\/supabase\/server"\)\)\.getSupabaseAdminClient\(\)\.then\(c => c\.from\("([^"]+)"\)\)\.select/g, `await (await (await import("@/shared/api/supabase/server")).getSupabaseAdminClient()).from("$1").select`);
fs.writeFileSync(path, code);
