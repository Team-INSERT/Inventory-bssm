const fs = require('fs');

const path = 'src/app/(protected)/admin/items/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Remove the mock data blocks.
code = code.replace(/\/\/ Mock Data for UI Publishing[\s\S]*?const groupedItems = items/m, `const groupedItems = (items || []).`);

fs.writeFileSync(path, code);
