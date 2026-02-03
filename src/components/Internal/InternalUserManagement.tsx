import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInternalAuth } from '@/contexts/InternalAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Loader2, Shield } from 'lucide-react';

interface InternalUser {
  id: string;
  username: string;
  full_name: string;
  role_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  internal_roles?: {
    id: string;
    name: string;
    is_master: boolean;
  } | null;
}

interface InternalRole {
  id: string;
  name: string;
  is_master: boolean;
}

const InternalUserManagement: React.FC = () => {
  const { hasPermission, isMaster } = useInternalAuth();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [roles, setRoles] = useState<InternalRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role_id: '',
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase
          .from('internal_users')
          .select(`
            *,
            internal_roles (id, name, is_master)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('internal_roles')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
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

  const handleOpenDialog = (user?: InternalUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        full_name: user.full_name,
        role_id: user.role_id || '',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role_id: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.full_name.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: 'Erro',
        description: 'Senha é obrigatória para novos usuários',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password && formData.password.length > 8) {
      toast({
        title: 'Erro',
        description: 'Senha deve ter no máximo 8 caracteres',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          username: formData.username.toLowerCase().trim(),
          full_name: formData.full_name.trim(),
          role_id: formData.role_id || null,
          is_active: formData.is_active
        };

        // If password provided, hash it
        if (formData.password) {
          const { data: hashedPassword, error: hashError } = await supabase
            .rpc('hash_password', { password: formData.password });
          
          if (hashError) throw hashError;
          updateData.password_hash = hashedPassword;
        }

        const { error } = await supabase
          .from('internal_users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso'
        });
      } else {
        // Create new user - hash password first
        const { data: hashedPassword, error: hashError } = await supabase
          .rpc('hash_password', { password: formData.password });

        if (hashError) throw hashError;

        const { error } = await supabase
          .from('internal_users')
          .insert({
            username: formData.username.toLowerCase().trim(),
            password_hash: hashedPassword,
            full_name: formData.full_name.trim(),
            role_id: formData.role_id || null,
            is_active: formData.is_active
          });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso'
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o usuário',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (user: InternalUser) => {
    if (user.internal_roles?.is_master) {
      toast({
        title: 'Erro',
        description: 'Não é possível excluir um Admin Master',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Deseja realmente excluir o usuário "${user.full_name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('internal_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canCreate = hasPermission('users.create');
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
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
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Atualize os dados do usuário abaixo'
                    : 'Preencha os dados para criar um novo usuário'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Usuário *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="nome.usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value.slice(0, 8) })}
                    placeholder="Máximo 8 caracteres"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.password.length}/8 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select
                    value={formData.role_id}
                    onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.is_master && ' (Master)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {editingUser ? 'Salvar' : 'Criar'}
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
              <TableHead>Usuário</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-[100px]">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>
                    {user.internal_roles ? (
                      <div className="flex items-center gap-2">
                        {user.internal_roles.is_master && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                        <span>{user.internal_roles.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('pt-BR')
                      : 'Nunca'
                    }
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && !user.internal_roles?.is_master && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InternalUserManagement;
