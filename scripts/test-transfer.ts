import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function run() {
  const { data, error } = await supabase.rpc("process_transfer", {
    p_item_id: "aaaa0000-0000-0000-0000-000000000001",
    p_from_warehouse_id: "11111111-1111-1111-1111-111111111111",
    p_to_warehouse_id: "22222222-2222-2222-2222-222222222222",
    p_quantity: 1,
    p_user_id: "6017fe5f-d590-423d-9075-f43de2e9aa10", // Dummy users id if existing, let's omit or give valid UUID
    p_reason: "Test JSON"
  });
  console.log("RPC call result:", error);
}
// don't really run unless needed, we just want to know if it's there
