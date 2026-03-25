import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ezdxnhglpbrjugxeafzo.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
);

async function run() {
  const { data, error } = await supabase
    .from("item_serials")
    .select("id, serial_number")
    .eq("status", "AVAILABLE");
  console.log("Data:", data, "\nError:", error);
}

run();
