-- Add cost_price and show_price_on_site to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS show_price_on_site boolean DEFAULT true;

-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  cnpj text,
  address text,
  city text,
  state text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create product_entries table
CREATE TABLE public.product_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  entry_date timestamp with time zone DEFAULT now(),
  notes text,
  created_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  attendant_name text NOT NULL,
  payment_method text NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  status text DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for suppliers
CREATE POLICY "Public can view active suppliers" ON public.suppliers
FOR SELECT USING (is_active = true);

CREATE POLICY "Internal users can manage suppliers" ON public.suppliers
FOR ALL USING (true);

-- RLS policies for product_entries
CREATE POLICY "Internal users can manage product entries" ON public.product_entries
FOR ALL USING (true);

-- RLS policies for sales
CREATE POLICY "Internal users can manage sales" ON public.sales
FOR ALL USING (true);

-- RLS policies for sale_items
CREATE POLICY "Internal users can manage sale items" ON public.sale_items
FOR ALL USING (true);

-- Update trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update trigger for sales
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();