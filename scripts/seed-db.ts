/**
 * Database Seed Script
 * Populates Supabase with mock data
 * Run with: npx ts-node scripts/seed-db.ts
 */

import { createClient } from "@supabase/supabase-js";

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

// Mock Data
const mockData = {
  warehouses: [
    { id: "ware-a", name: "A구역 (본관 창고)" },
    { id: "ware-b", name: "B구역 (신관 자재실)" },
    { id: "ware-c", name: "C구역 (실습동 소모품실)" },
  ],
  items: [
    {
      id: "item-1",
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
      id: "item-2",
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
      id: "item-3",
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
      id: "item-4",
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
      id: "item-5",
      name: "CAT.6 LAN 케이블 5m",
      category: "케이블",
      barcode: "CABLE-5M-001",
      production_year: 2024,
      service_life: 10,
      has_serial_number: false,
      has_service_life: false,
      min_stock: 20,
    },
  ],
  inventory: [
    { item_id: "item-1", warehouse_id: "ware-a", quantity: 5 },
    { item_id: "item-2", warehouse_id: "ware-a", quantity: 8 },
    { item_id: "item-3", warehouse_id: "ware-b", quantity: 15 },
    { item_id: "item-4", warehouse_id: "ware-b", quantity: 2 },
    { item_id: "item-5", warehouse_id: "ware-c", quantity: 50 },
  ],
  item_serials: [
    {
      item_id: "item-1",
      serial_number: "MBP-24-001",
      warehouse_id: "ware-a",
      status: "AVAILABLE",
    },
    {
      item_id: "item-1",
      serial_number: "MBP-24-002",
      warehouse_id: "ware-a",
      status: "AVAILABLE",
    },
    {
      item_id: "item-2",
      serial_number: "LG27-23-001",
      warehouse_id: "ware-a",
      status: "AVAILABLE",
    },
    {
      item_id: "item-3",
      serial_number: "MOUSE-24-001",
      warehouse_id: "ware-b",
      status: "AVAILABLE",
    },
  ],
};

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed...\n");

    // 1. Clear existing data (optional)
    console.log("📋 Clearing existing data...");
    await supabase.from("item_serials").delete().neq("id", "");
    await supabase.from("inventory").delete().neq("id", "");
    await supabase.from("items").delete().neq("id", "");
    await supabase.from("warehouses").delete().neq("id", "");
    console.log("✅ Data cleared\n");

    // 2. Insert Warehouses
    console.log("📦 Inserting warehouses...");
    const { error: warehouseError } = await supabase
      .from("warehouses")
      .insert(mockData.warehouses);
    if (warehouseError) throw warehouseError;
    console.log(`✅ ${mockData.warehouses.length} warehouses inserted\n`);

    // 3. Insert Items
    console.log("📱 Inserting items...");
    const { error: itemError } = await supabase
      .from("items")
      .insert(mockData.items);
    if (itemError) throw itemError;
    console.log(`✅ ${mockData.items.length} items inserted\n`);

    // 4. Insert Inventory
    console.log("📊 Inserting inventory records...");
    const { error: inventoryError } = await supabase
      .from("inventory")
      .insert(mockData.inventory);
    if (inventoryError) throw inventoryError;
    console.log(`✅ ${mockData.inventory.length} inventory records inserted\n`);

    // 5. Insert Item Serials
    console.log("🔤 Inserting item serials...");
    const { error: serialError } = await supabase
      .from("item_serials")
      .insert(mockData.item_serials);
    if (serialError) throw serialError;
    console.log(`✅ ${mockData.item_serials.length} item serials inserted\n`);

    console.log("🎉 Database seed completed successfully!");
    console.log("\nData Summary:");
    console.log(`  • Warehouses: ${mockData.warehouses.length}`);
    console.log(`  • Items: ${mockData.items.length}`);
    console.log(`  • Inventory Records: ${mockData.inventory.length}`);
    console.log(`  • Item Serials: ${mockData.item_serials.length}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
