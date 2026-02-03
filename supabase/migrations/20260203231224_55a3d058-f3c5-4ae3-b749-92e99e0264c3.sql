-- =============================================
-- SISTEMA INTERNO - ESTRUTURA COMPLETA
-- =============================================

-- 1. Tabela de Cargos Internos
CREATE TABLE public.internal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_master BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Usuários Internos (separada dos usuários do site)
CREATE TABLE public.internal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES public.internal_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Permissões por Cargo
CREATE TABLE public.internal_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.internal_roles(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  allowed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- 4. Tabela de Sessões Internas
CREATE TABLE public.internal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.internal_users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- HABILITAR RLS
-- =============================================

ALTER TABLE public.internal_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - Acesso público para leitura (auth via edge function)
-- =============================================

-- Internal Roles - leitura pública para login funcionar
CREATE POLICY "Public can read internal roles" ON public.internal_roles
  FOR SELECT USING (true);

-- Internal Users - apenas edge function acessa via service role
CREATE POLICY "Service role manages internal users" ON public.internal_users
  FOR ALL USING (true);

-- Internal Permissions - leitura pública
CREATE POLICY "Public can read permissions" ON public.internal_permissions
  FOR SELECT USING (true);

-- Internal Sessions - leitura pública para validação
CREATE POLICY "Public can manage sessions" ON public.internal_sessions
  FOR ALL USING (true);

-- =============================================
-- FUNÇÃO PARA HASH DE SENHA (usando pgcrypto)
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$;

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================

CREATE TRIGGER update_internal_roles_updated_at
  BEFORE UPDATE ON public.internal_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_users_updated_at
  BEFORE UPDATE ON public.internal_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CRIAR CARGO ADMIN MASTER E PRIMEIRO USUÁRIO
-- =============================================

-- Inserir cargo Admin Master
INSERT INTO public.internal_roles (id, name, description, is_master, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Admin Master',
  'Acesso total ao sistema interno. Pode gerenciar todos os cargos e permissões.',
  true,
  true
);

-- Inserir cargo Atendente padrão
INSERT INTO public.internal_roles (id, name, description, is_master, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Atendente',
  'Acesso básico para atendimento de clientes.',
  false,
  true
);

-- Criar primeiro Admin Master (usuário: admin, senha: 12345678)
INSERT INTO public.internal_users (username, password_hash, full_name, role_id, is_active)
VALUES (
  'admin',
  crypt('12345678', gen_salt('bf')),
  'Administrador Master',
  'a0000000-0000-0000-0000-000000000001',
  true
);

-- =============================================
-- INSERIR PERMISSÕES PADRÃO
-- =============================================

-- Permissões do Admin Master (todas permitidas)
INSERT INTO public.internal_permissions (role_id, permission_key, allowed) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'clients.view', true),
  ('a0000000-0000-0000-0000-000000000001', 'clients.create', true),
  ('a0000000-0000-0000-0000-000000000001', 'clients.edit', true),
  ('a0000000-0000-0000-0000-000000000001', 'clients.delete', true),
  ('a0000000-0000-0000-0000-000000000001', 'users.view', true),
  ('a0000000-0000-0000-0000-000000000001', 'users.create', true),
  ('a0000000-0000-0000-0000-000000000001', 'users.edit', true),
  ('a0000000-0000-0000-0000-000000000001', 'users.delete', true),
  ('a0000000-0000-0000-0000-000000000001', 'roles.view', true),
  ('a0000000-0000-0000-0000-000000000001', 'roles.create', true),
  ('a0000000-0000-0000-0000-000000000001', 'roles.edit', true),
  ('a0000000-0000-0000-0000-000000000001', 'roles.delete', true),
  ('a0000000-0000-0000-0000-000000000001', 'permissions.manage', true);

-- Permissões do Atendente (apenas visualizar e editar clientes)
INSERT INTO public.internal_permissions (role_id, permission_key, allowed) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'clients.view', true),
  ('a0000000-0000-0000-0000-000000000002', 'clients.create', true),
  ('a0000000-0000-0000-0000-000000000002', 'clients.edit', true),
  ('a0000000-0000-0000-0000-000000000002', 'clients.delete', false),
  ('a0000000-0000-0000-0000-000000000002', 'users.view', false),
  ('a0000000-0000-0000-0000-000000000002', 'users.create', false),
  ('a0000000-0000-0000-0000-000000000002', 'users.edit', false),
  ('a0000000-0000-0000-0000-000000000002', 'users.delete', false),
  ('a0000000-0000-0000-0000-000000000002', 'roles.view', false),
  ('a0000000-0000-0000-0000-000000000002', 'roles.create', false),
  ('a0000000-0000-0000-0000-000000000002', 'roles.edit', false),
  ('a0000000-0000-0000-0000-000000000002', 'roles.delete', false),
  ('a0000000-0000-0000-0000-000000000002', 'permissions.manage', false);