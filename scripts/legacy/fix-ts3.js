const fs = require('fs');

const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const \{ createClient \} = await import\("@\/shared\/api\/supabase\/server"\);\n\s*const supabase = await createClient\(\);/g, `const { getSupabaseAdminClient } = await import("@/shared/api/supabase/server");\n  const supabase = await getSupabaseAdminClient();`);

code = code.replace(/await \(await import\("@\/shared\/api\/supabase\/server"\)\)\.getSupabaseAdminClient\(\)\.then\(c => c\.from\("([^"]+)"\)\)\.select/g, `await supabase.from("$1").select`);

fs.writeFileSync(path, code);
