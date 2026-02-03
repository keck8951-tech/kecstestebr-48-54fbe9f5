import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternalAuth } from '@/contexts/InternalAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  Shield, 
  LogOut, 
  Building2,
  Loader2,
  UserCog
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ClientManagement from '@/components/Admin/ClientManagement';
import InternalUserManagement from '@/components/Internal/InternalUserManagement';
import InternalRoleManagement from '@/components/Internal/InternalRoleManagement';

const InternalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, hasPermission, isMaster } = useInternalAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/interno');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema"
    });
    navigate('/interno');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    {
      id: 'clients',
      label: 'Clientes',
      icon: Building2,
      permission: 'clients.view',
      component: <ClientManagement />
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      permission: 'users.view',
      component: <InternalUserManagement />
    },
    {
      id: 'roles',
      label: 'Cargos',
      icon: Shield,
      permission: 'roles.view',
      component: <InternalRoleManagement />
    }
  ].filter(tab => hasPermission(tab.permission));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sistema Interno</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.fullName} • {user?.role?.name || 'Sem cargo'}
                  {isMaster && <span className="ml-2 text-primary font-medium">(Master)</span>}
                </p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {tabs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Sem permissões</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar nenhuma área do sistema.
                Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={tabs[0]?.id} className="space-y-6">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <tab.icon className="h-5 w-5" />
                      {tab.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tab.component}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default InternalDashboardPage;
