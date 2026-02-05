-- Add stock column to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;

-- Create function to update stock on product entry
CREATE OR REPLACE FUNCTION public.update_stock_on_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock = stock + NEW.quantity 
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET stock = stock - OLD.quantity 
    WHERE id = OLD.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create function to update stock on sale
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock = stock - NEW.quantity 
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET stock = stock + OLD.quantity 
    WHERE id = OLD.product_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_update_stock_on_entry
AFTER INSERT OR DELETE ON product_entries
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_entry();

CREATE TRIGGER trigger_update_stock_on_sale
AFTER INSERT OR DELETE ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale();