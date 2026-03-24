-- 1. Create a custom enum type for User Roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- 2. Create Users table extending auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to automatically create a user record when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Warehouses table
CREATE TABLE public.warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Only admins can insert/update/delete warehouses" ON public.warehouses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Items table
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT,
  image_url TEXT,
  production_year INTEGER,
  service_life INTEGER,
  has_serial_number BOOLEAN DEFAULT false NOT NULL,
  has_service_life BOOLEAN DEFAULT true NOT NULL,
  min_stock INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Only admins can modify items" ON public.items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4.5 Item Serials table
CREATE TABLE public.item_serials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  serial_number TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'AVAILABLE' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(item_id, serial_number)
);

ALTER TABLE public.item_serials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read item_serials" ON public.item_serials FOR SELECT USING (true);
CREATE POLICY "Only admins can modify item_serials" ON public.item_serials FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Inventory table (mapping items, warehouses, and quantity)
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(item_id, warehouse_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Only admins can modify inventory directly" ON public.inventory FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Transactions table (Audit log for check-in, check-out, and transfers)
CREATE TYPE public.transaction_type AS ENUM ('IN', 'OUT', 'TRANSFER', 'DISPOSE');

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  type public.transaction_type NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. RPC functions for atomic operations (e.g., check-out, transfer)
CREATE OR REPLACE FUNCTION process_checkout(
  p_item_id UUID, 
  p_warehouse_id UUID, 
  p_quantity INTEGER, 
  p_user_id UUID, 
  p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Deduct from inventory
  UPDATE public.inventory 
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE item_id = p_item_id AND warehouse_id = p_warehouse_id AND quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quantity or inventory record not found';
  END IF;

  -- Log transaction
  INSERT INTO public.transactions (item_id, from_warehouse_id, user_id, quantity, type, reason)
  VALUES (p_item_id, p_warehouse_id, p_user_id, p_quantity, 'OUT', p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION process_transfer(
  p_item_id UUID,
  p_from_warehouse_id UUID,
  p_to_warehouse_id UUID,
  p_quantity INTEGER,
  p_user_id UUID,
  p_reason TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Deduct from source warehouse
  UPDATE public.inventory
  SET quantity = quantity - p_quantity, updated_at = now()
  WHERE item_id = p_item_id AND warehouse_id = p_from_warehouse_id AND quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient quantity in source warehouse';
  END IF;

  -- Add to target warehouse
  INSERT INTO public.inventory (item_id, warehouse_id, quantity)
  VALUES (p_item_id, p_to_warehouse_id, p_quantity)
  ON CONFLICT (item_id, warehouse_id) 
  DO UPDATE SET quantity = public.inventory.quantity + p_quantity, updated_at = now();

  -- Log transaction
  INSERT INTO public.transactions (item_id, from_warehouse_id, to_warehouse_id, user_id, quantity, type, reason)
  VALUES (p_item_id, p_from_warehouse_id, p_to_warehouse_id, p_user_id, p_quantity, 'TRANSFER', p_reason);
END;
$$;
