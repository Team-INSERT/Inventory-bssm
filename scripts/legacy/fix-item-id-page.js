const fs = require('fs');
const path = 'src/app/(protected)/admin/items/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/export default function ItemDetailPage\(\{ params \}: \{ params: \{ id: string \} \}\) \{([\s\S]*?)if \(!item\) \{/m, `export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const { createClient } = await import("@/shared/api/supabase/server");
  const supabase = await createClient();
  const resolvedParams = await params;
  
  const { data: itemData } = await supabase.from("items").select("*").eq("id", resolvedParams.id).single();
  const { data: itemSerials } = await supabase.from("item_serials").select("*, warehouses(*)").eq("item_id", resolvedParams.id);
  
  const item = itemData ? { ...itemData, serials: itemSerials || [] } : null;
  
  if (!item) {`);

fs.writeFileSync(path, code);
