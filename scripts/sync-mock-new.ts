import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ezdxnhglpbrjugxeafzo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sync() {
  console.log("🛠️ Syncing inventory quantities with serial number counts...");

  // 맥북 프로: 시리얼 2개
  await supabase.from("inventory").update({ quantity: 2 }).eq("item_id", "aaaa0000-0000-0000-0000-000000000001");
  // LG 모니터: 시리얼 1개
  await supabase.from("inventory").update({ quantity: 1 }).eq("item_id", "aaaa0000-0000-0000-0000-000000000002");
  // 매직 마우스: 시리얼 1개
  await supabase.from("inventory").update({ quantity: 1 }).eq("item_id", "aaaa0000-0000-0000-0000-000000000003");

  console.log("✅ Inventory quantities adjusted to match existing serial records!");
}

sync();