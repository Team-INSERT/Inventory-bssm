const fs = require('fs');
const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const groupedItems = \(items \|\| \[\]\)\.\.reduce/, `const groupedItems = (items || []).reduce`);
code = code.replace(/;\s*{\s*const groupedItems/, `; const groupedItems`);

fs.writeFileSync(path, code);
