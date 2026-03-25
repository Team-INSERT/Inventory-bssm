import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://ezdxnhglpbrjugxeafzo.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
async function run() {
  const { data: items } = await supabase.from("items").select("*");
  const { data: item_serials } = await supabase.from("item_serials").select("*");
  const { data: inventory } = await supabase.from("inventory").select("*");
  console.log("Items:", items);
  console.log("Serials:", item_serials);
  console.log("Inventory:", inventory);
}
run();
