/**
 * Database Seed Script (JavaScript version)
 * Populates Supabase with mock data
 * Run with: node scripts/seed-db.js
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ezdxnhglpbrjugxeafzo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...\n");

    // 1. Clear existing data
    console.log("📋 Clearing existing data...");
    await supabase.from("item_serials").delete().neq("id", "");
    await supabase.from("inventory").delete().neq("id", "");
    await supabase.from("items").delete().neq("id", "");
    await supabase.from("warehouses").delete().neq("id", "");
    console.log("✅ Data cleared\n");

    // 2. Insert Warehouses (UUID auto-generated)
    console.log("📦 Inserting warehouses...");
    const warehouseData = [
      { name: "A구역 (본관 창고)" },
      { name: "B구역 (신관 자재실)" },
      { name: "C구역 (실습동 소모품실)" },
    ];
    const { data: warehouses, error: warehouseError } = await supabase
      .from("warehouses")
      .insert(warehouseData)
      .select();
    if (warehouseError) throw warehouseError;
    console.log(`✅ ${warehouses.length} warehouses inserted\n`);

    // 3. Insert Items (UUID auto-generated)
    console.log("📱 Inserting items...");
    const itemData = [
      {
        name: "맥북 프로 14인치 (M3)",
        category: "노트북",
        barcode: "MBP14-001",
        production_year: 2024,
        service_life: 5,
        has_serial_number: true,
        has_service_life: true,
        min_stock: 2,
      },
      {
        name: "LG 27인치 4K 모니터",
        category: "디스플레이",
        barcode: "LG27-4K-001",
        production_year: 2023,
        service_life: 5,
        has_serial_number: true,
        has_service_life: true,
        min_stock: 3,
      },
      {
        name: "매직 마우스 2",
        category: "주변기기",
        barcode: "MOUSE-001",
        production_year: 2024,
        service_life: 3,
        has_serial_number: true,
        has_service_life: true,
        min_stock: 5,
      },
      {
        name: "USB-C 허브 (7-in-1)",
        category: "주변기기",
        barcode: "HUB-7IN1-001",
        production_year: 2023,
        service_life: 4,
        has_serial_number: false,
        has_service_life: true,
        min_stock: 10,
      },
      {
        name: "CAT.6 LAN 케이블 5m",
        category: "케이블",
        barcode: "CABLE-5M-001",
        production_year: 2024,
        service_life: 10,
        has_serial_number: false,
        has_service_life: false,
        min_stock: 20,
      },
    ];
    const { data: items, error: itemError } = await supabase
      .from("items")
      .insert(itemData)
      .select();
    if (itemError) throw itemError;
    console.log(`✅ ${items.length} items inserted\n`);

    // 4. Insert Inventory with actual UUIDs
    console.log("📊 Inserting inventory records...");
    const inventoryData = [
      { item_id: items[0].id, warehouse_id: warehouses[0].id, quantity: 5 },
      { item_id: items[1].id, warehouse_id: warehouses[0].id, quantity: 8 },
      { item_id: items[2].id, warehouse_id: warehouses[1].id, quantity: 15 },
      { item_id: items[3].id, warehouse_id: warehouses[1].id, quantity: 2 },
      { item_id: items[4].id, warehouse_id: warehouses[2].id, quantity: 50 },
    ];
    const { data: inventory, error: inventoryError } = await supabase
      .from("inventory")
      .insert(inventoryData)
      .select();
    if (inventoryError) throw inventoryError;
    console.log(`✅ ${inventory.length} inventory records inserted\n`);

    // 5. Insert Item Serials with actual UUIDs
    console.log("🔤 Inserting item serials...");
    const serialData = [
      {
        item_id: items[0].id,
        serial_number: "MBP-24-001",
        warehouse_id: warehouses[0].id,
        status: "AVAILABLE",
      },
      {
        item_id: items[0].id,
        serial_number: "MBP-24-002",
        warehouse_id: warehouses[0].id,
        status: "AVAILABLE",
      },
      {
        item_id: items[1].id,
        serial_number: "LG27-23-001",
        warehouse_id: warehouses[0].id,
        status: "AVAILABLE",
      },
      {
        item_id: items[2].id,
        serial_number: "MOUSE-24-001",
        warehouse_id: warehouses[1].id,
        status: "AVAILABLE",
      },
    ];
    const { data: serials, error: serialError } = await supabase
      .from("item_serials")
      .insert(serialData)
      .select();
    if (serialError) throw serialError;
    console.log(`✅ ${serials.length} item serials inserted\n`);

    console.log("🎉 Database seed completed successfully!");
    console.log("\nData Summary:");
    console.log(`  • Warehouses: ${warehouses.length}`);
    console.log(`  • Items: ${items.length}`);
    console.log(`  • Inventory Records: ${inventory.length}`);
    console.log(`  • Item Serials: ${serials.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
