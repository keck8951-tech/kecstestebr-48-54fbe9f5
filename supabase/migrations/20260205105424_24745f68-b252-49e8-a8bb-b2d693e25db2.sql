-- Add new permissions for the internal system features
-- Get the Master role ID and add permissions
DO $$
DECLARE
  master_role_id uuid;
BEGIN
  SELECT id INTO master_role_id FROM internal_roles WHERE is_master = true LIMIT 1;
  
  IF master_role_id IS NOT NULL THEN
    -- Products permissions
    INSERT INTO internal_permissions (role_id, permission_key, allowed) 
    VALUES 
      (master_role_id, 'products.view', true),
      (master_role_id, 'products.create', true),
      (master_role_id, 'products.edit', true),
      (master_role_id, 'products.delete', true)
    ON CONFLICT DO NOTHING;
    
    -- Suppliers permissions
    INSERT INTO internal_permissions (role_id, permission_key, allowed) 
    VALUES 
      (master_role_id, 'suppliers.view', true),
      (master_role_id, 'suppliers.create', true),
      (master_role_id, 'suppliers.edit', true),
      (master_role_id, 'suppliers.delete', true)
    ON CONFLICT DO NOTHING;
    
    -- Entries permissions
    INSERT INTO internal_permissions (role_id, permission_key, allowed) 
    VALUES 
      (master_role_id, 'entries.view', true),
      (master_role_id, 'entries.create', true)
    ON CONFLICT DO NOTHING;
    
    -- Sales permissions
    INSERT INTO internal_permissions (role_id, permission_key, allowed) 
    VALUES 
      (master_role_id, 'sales.view', true),
      (master_role_id, 'sales.create', true),
      (master_role_id, 'sales.edit', true),
      (master_role_id, 'sales.delete', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;