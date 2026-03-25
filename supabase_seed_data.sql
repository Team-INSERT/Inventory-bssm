-- 🌱 Optional: Script to insert mock data via SQL
-- Use this if you prefer to seed data manually in the Supabase SQL Editor
-- instead of using the seed-db.js script

-- Insert Warehouses (UUID will be auto-generated)
INSERT INTO public.warehouses (name) VALUES
  ('A구역 (본관 창고)'),
  ('B구역 (신관 자재실)'),
  ('C구역 (실습동 소모품실)');

-- Get warehouse IDs for later reference
-- Select and save these IDs from the table after insertion

-- Insert Items (UUID will be auto-generated)
INSERT INTO public.items (name, category, barcode, production_year, service_life, has_serial_number, has_service_life, min_stock) VALUES
  ('맥북 프로 14인치 (M3)', '노트북', 'MBP14-001', 2024, 5, true, true, 2),
  ('LG 27인치 4K 모니터', '디스플레이', 'LG27-4K-001', 2023, 5, true, true, 3),
  ('매직 마우스 2', '주변기기', 'MOUSE-001', 2024, 3, true, true, 5),
  ('USB-C 허브 (7-in-1)', '주변기기', 'HUB-7IN1-001', 2023, 4, false, true, 10),
  ('CAT.6 LAN 케이블 5m', '케이블', 'CABLE-5M-001', 2024, 10, false, false, 20);

-- Note: For Inventory and Item Serials, you need the actual UUIDs
-- Run this query first to get the IDs:
-- SELECT id, name FROM public.warehouses;
-- SELECT id, name FROM public.items;
-- Then use those UUIDs in the INSERTs below

-- Insert Inventory (UUID will be auto-generated for id, but you need item_id and warehouse_id)
-- Uncomment and update with actual UUIDs after getting them from above queries
/*
INSERT INTO public.inventory (item_id, warehouse_id, quantity) VALUES
  ('<item-1-uuid>', '<ware-a-uuid>', 5),
  ('<item-2-uuid>', '<ware-a-uuid>', 8),
  ('<item-3-uuid>', '<ware-b-uuid>', 15),
  ('<item-4-uuid>', '<ware-b-uuid>', 2),
  ('<item-5-uuid>', '<ware-c-uuid>', 50);

-- Insert Item Serials (UUID will be auto-generated for id, but you need item_id and warehouse_id)
INSERT INTO public.item_serials (item_id, serial_number, warehouse_id, status) VALUES
  ('<item-1-uuid>', 'MBP-24-001', '<ware-a-uuid>', 'AVAILABLE'),
  ('<item-1-uuid>', 'MBP-24-002', '<ware-a-uuid>', 'AVAILABLE'),
  ('<item-2-uuid>', 'LG27-23-001', '<ware-a-uuid>', 'AVAILABLE'),
  ('<item-3-uuid>', 'MOUSE-24-001', '<ware-b-uuid>', 'AVAILABLE');
*/
