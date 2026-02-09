import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInternalAuth } from '@/contexts/InternalAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2, Shield, Settings } from 'lucide-react';

interface InternalRole {
  id: string;
  name: string;
  description: string | null;
  is_master: boolean;
  is_active: boolean;
  created_at: string;
}

interface Permission {
  id: string;
  role_id: string;
  permission_key: string;
  allowed: boolean;
}

const PERMISSION_GROUPS = {
  'Produtos': [
    { key: 'products.view', label: 'Visualizar produtos' },
    { key: 'products.create', label: 'Criar produtos' },
    { key: 'products.edit', label: 'Editar produtos' },
    { key: 'products.delete', label: 'Excluir produtos' },
  ],
  'Entradas': [
    { key: 'entries.view', label: 'Visualizar entradas' },
    { key: 'entries.create', label: 'Criar entradas' },
    { key: 'entries.delete', label: 'Excluir entradas' },
  ],
  'Fornecedores': [
    { key: 'suppliers.view', label: 'Visualizar fornecedores' },
    { key: 'suppliers.create', label: 'Criar fornecedores' },
    { key: 'suppliers.edit', label: 'Editar fornecedores' },
    { key: 'suppliers.delete', label: 'Excluir fornecedores' },
  ],
  'Vendas': [
    { key: 'sales.view', label: 'Visualizar vendas' },
    { key: 'sales.create', label: 'Criar vendas' },
    { key: 'sales.edit', label: 'Editar vendas' },
    { key: 'sales.cancel', label: 'Cancelar vendas' },
  ],
  'Relatórios': [
    { key: 'reports.view', label: 'Visualizar relatórios' },
  ],
  'Clientes': [
    { key: 'clients.view', label: 'Visualizar clientes' },
    { key: 'clients.create', label: 'Criar clientes' },
    { key: 'clients.edit', label: 'Editar clientes' },
    { key: 'clients.delete', label: 'Excluir clientes' },
  ],
  'Usuários': [
    { key: 'users.view', label: 'Visualizar usuários' },
    { key: 'users.create', label: 'Criar usuários' },
    { key: 'users.edit', label: 'Editar usuários' },
    { key: 'users.delete', label: 'Excluir usuários' },
  ],
  'Cargos': [
    { key: 'roles.view', label: 'Visualizar cargos' },
    { key: 'roles.create', label: 'Criar cargos' },
    { key: 'roles.edit', label: 'Editar cargos' },
    { key: 'roles.delete', label: 'Excluir cargos' },
  ],
  'Sistema': [
    { key: 'permissions.manage', label: 'Gerenciar permissões' },
  ],
};

const InternalRoleManagement: React.FC = () => {
  const { hasPermission, isMaster } = useInternalAuth();
  const [roles, setRoles] = useState<InternalRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<InternalRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<InternalRole | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        supabase
          .from('internal_roles')
          .select('*')
          .order('is_master', { ascending: false })
          .order('name'),
        supabase
          .from('internal_permissions')
          .select('*')
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;

      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (role?: InternalRole) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        is_active: role.is_active
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleOpenPermissions = (role: InternalRole) => {
    setSelectedRole(role);
    
    // Build permissions map for this role
    const rolePerms: Record<string, boolean> = {};
    permissions
      .filter(p => p.role_id === role.id)
      .forEach(p => {
        rolePerms[p.permission_key] = p.allowed;
      });
    
    setRolePermissions(rolePerms);
    setPermissionsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do cargo é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('internal_roles')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active
          })
          .eq('id', editingRole.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Cargo atualizado com sucesso'
        });
      } else {
        const { data: newRole, error } = await supabase
          .from('internal_roles')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (error) throw error;

        // Create default permissions (all false)
        const allPermKeys = Object.values(PERMISSION_GROUPS).flat().map(p => p.key);
        const permInserts = allPermKeys.map(key => ({
          role_id: newRole.id,
          permission_key: key,
          allowed: false
        }));

        await supabase.from('internal_permissions').insert(permInserts);

        toast({
          title: 'Sucesso',
          description: 'Cargo criado com sucesso'
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving role:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cargo',
        variant: 'destructive'
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const token = localStorage.getItem('internal_auth_token');
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Sessão expirada. Faça login novamente.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('internal-auth', {
        body: {
          action: 'manage_permissions',
          token,
          role_id: selectedRole.id,
          permissions: rolePermissions
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Erro ao salvar permissões');
      }

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso'
      });

      setPermissionsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar as permissões',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (role: InternalRole) => {
    if (role.is_master) {
      toast({
        title: 'Erro',
        description: 'Não é possível excluir o cargo Master',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Deseja realmente excluir o cargo "${role.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('internal_roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Cargo excluído com sucesso'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cargo',
        variant: 'destructive'
      });
    }
  };

  const togglePermission = (key: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleGroup = (groupKeys: string[], allEnabled: boolean) => {
    const newPerms = { ...rolePermissions };
    groupKeys.forEach(key => {
      newPerms[key] = !allEnabled;
    });
    setRolePermissions(newPerms);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canCreate = hasPermission('roles.create');
  const canEdit = hasPermission('roles.edit');
  const canDelete = hasPermission('roles.delete');
  const canManagePermissions = hasPermission('permissions.manage');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cargos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
                </DialogTitle>
                <DialogDescription>
                  {editingRole 
                    ? 'Atualize os dados do cargo abaixo'
                    : 'Preencha os dados para criar um novo cargo'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cargo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Gerente, Vendedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva as responsabilidades deste cargo"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingRole ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cargo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum cargo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.is_master && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{role.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {role.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? 'default' : 'secondary'}>
                      {role.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canManagePermissions && !role.is_master && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenPermissions(role)}
                          title="Gerenciar permissões"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && !role.is_master && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && !role.is_master && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {role.is_master && (
                        <span className="text-xs text-muted-foreground">
                          Protegido
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permissões: {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Configure as permissões para este cargo
            </DialogDescription>
          </DialogHeader>

          <Accordion type="multiple" className="w-full">
            {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPerms]) => {
              const allEnabled = groupPerms.every(p => rolePermissions[p.key]);
              const someEnabled = groupPerms.some(p => rolePermissions[p.key]);
              
              return (
                <AccordionItem key={groupName} value={groupName}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allEnabled}
                        className={someEnabled && !allEnabled ? 'data-[state=checked]:bg-primary/50' : ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(groupPerms.map(p => p.key), allEnabled);
                        }}
                      />
                      <span>{groupName}</span>
                      <Badge variant="secondary" className="ml-2">
                        {groupPerms.filter(p => rolePermissions[p.key]).length}/{groupPerms.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-6">
                      {groupPerms.map(perm => (
                        <div key={perm.key} className="flex items-center gap-3">
                          <Checkbox
                            id={perm.key}
                            checked={rolePermissions[perm.key] || false}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <Label 
                            htmlFor={perm.key}
                            className="cursor-pointer"
                          >
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions}>
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalRoleManagement;
