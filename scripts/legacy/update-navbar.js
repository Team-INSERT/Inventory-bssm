const fs = require('fs');

const path = 'src/widgets/navbar/ui/navbar.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /const { data: userData } = await supabase[\s\S]*?const isAdmin = userData\?\.role === "admin";[\s\S]*?const displayName = userData\?\.full_name \|\| user\.email\?\.split\("@"\)\[0\];/m,
  `const isAdmin = user.user_metadata?.role === "admin";
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0];`
);

fs.writeFileSync(path, code);
