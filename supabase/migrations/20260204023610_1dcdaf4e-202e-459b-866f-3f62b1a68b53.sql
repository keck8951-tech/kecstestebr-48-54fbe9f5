-- Habilitar extensão pgcrypto (necessário para hash de senha)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recriar funções usando o schema correto
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN password_hash = extensions.crypt(password, password_hash);
END;
$$;

-- Recriar o usuário admin com senha correta
DELETE FROM public.internal_users WHERE username = 'admin';

INSERT INTO public.internal_users (username, password_hash, full_name, role_id, is_active)
VALUES (
  'admin',
  extensions.crypt('12345678', extensions.gen_salt('bf')),
  'Administrador Master',
  'a0000000-0000-0000-0000-000000000001',
  true
);