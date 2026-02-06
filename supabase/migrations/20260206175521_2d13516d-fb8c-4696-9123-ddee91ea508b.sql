-- Add reports permission for the Master role
DO $$
DECLARE
  master_role_id uuid;
BEGIN
  SELECT id INTO master_role_id FROM internal_roles WHERE is_master = true LIMIT 1;
  
  IF master_role_id IS NOT NULL THEN
    INSERT INTO internal_permissions (role_id, permission_key, allowed) 
    VALUES 
      (master_role_id, 'reports.view', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;