import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternalAuth } from '@/contexts/InternalAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Settings, 
  Shield, 
  LogOut, 
  Building2,
  Loader2,
  Package,
  PackagePlus,
  Truck,
  ShoppingCart,
  BarChart3,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ClientManagement from '@/components/Admin/ClientManagement';
import InternalUserManagement from '@/components/Internal/InternalUserManagement';
import InternalRoleManagement from '@/components/Internal/InternalRoleManagement';
import InternalProductManagement from '@/components/Internal/InternalProductManagement';
import InternalSupplierManagement from '@/components/Internal/InternalSupplierManagement';
import InternalProductEntries from '@/components/Internal/InternalProductEntries';
import InternalSalesManagement from '@/components/Internal/InternalSalesManagement';
import InternalSalesReport from '@/components/Internal/InternalSalesReport';
import { cn } from '@/lib/utils';

const allTabs = [
  { id: 'products', label: 'Produtos', icon: Package, permission: 'products.view', component: <InternalProductManagement /> },
  { id: 'entries', label: 'Entradas', icon: PackagePlus, permission: 'entries.view', component: <InternalProductEntries /> },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck, permission: 'suppliers.view', component: <InternalSupplierManagement /> },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart, permission: 'sales.view', component: <InternalSalesManagement /> },
  { id: 'reports', label: 'Relatórios', icon: BarChart3, permission: 'reports.view', component: <InternalSalesReport /> },
  { id: 'clients', label: 'Clientes', icon: Building2, permission: 'clients.view', component: <ClientManagement /> },
  { id: 'users', label: 'Usuários', icon: Users, permission: 'users.view', component: <InternalUserManagement /> },
  { id: 'roles', label: 'Cargos', icon: Shield, permission: 'roles.view', component: <InternalRoleManagement /> },
];

const InternalDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, hasPermission, isMaster } = useInternalAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = allTabs.filter(tab => hasPermission(tab.permission));

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/interno');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logout realizado", description: "Você foi desconectado do sistema" });
    navigate('/interno');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeTabData = tabs.find(t => t.id === activeTab);

  const NavItems = () => (
    <nav className="flex flex-col gap-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <tab.icon className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
        </button>
      ))}
    </nav>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="p-4 pb-2">
                  <SheetTitle className="text-left text-base">Sistema Interno</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.fullName} • {user?.role?.name || 'Sem cargo'}
                    {isMaster && <span className="ml-1 text-primary font-medium">(Master)</span>}
                  </p>
                </div>
                <Separator />
                <ScrollArea className="flex-1 px-3 py-3">
                  <NavItems />
                </ScrollArea>
                <Separator />
                <div className="p-3">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                {activeTabData?.label || 'Sistema Interno'}
              </h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 p-3 overflow-auto">
          {tabs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Sem permissões</h2>
                <p className="text-muted-foreground text-sm">
                  Você não tem permissão para acessar nenhuma área do sistema.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeTabData?.component
          )}
        </main>
      </div>
    );
  }

  // Desktop / Tablet layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 h-screen border-r bg-card flex flex-col transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn("p-4 flex items-center", sidebarCollapsed ? "justify-center" : "justify-between")}>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">Sistema Interno</h1>
              <p className="text-xs text-muted-foreground truncate">
                {user?.fullName}
                {isMaster && <span className="ml-1 text-primary">(M)</span>}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <Separator />

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-3">
          <NavItems />
        </ScrollArea>

        <Separator />

        {/* Sidebar Footer */}
        <div className="p-3">
          <Button
            variant="outline"
            className={cn("w-full", sidebarCollapsed && "px-0")}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTabData && <activeTabData.icon className="h-5 w-5 text-primary" />}
            <h2 className="text-lg font-semibold">{activeTabData?.label}</h2>
          </div>
          <p className="text-xs text-muted-foreground hidden md:block">
            {user?.role?.name || 'Sem cargo'}
          </p>
        </header>

        <div className="p-6">
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
            activeTabData?.component
          )}
        </div>
      </main>
    </div>
  );
};

export default InternalDashboardPage;
