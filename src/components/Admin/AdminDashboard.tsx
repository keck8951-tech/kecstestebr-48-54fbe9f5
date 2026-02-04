import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Package, 
  Image, 
  Tags, 
  Users, 
  Star, 
  Settings, 
  Computer,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ProductManagement from './ProductManagement';
import BannerManagement from './BannerManagement';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';
import FeaturedProductsManagement from './FeaturedProductsManagement';
import StoreCredentialsManagement from './StoreCredentialsManagement';
import ReadyPcManagement from './ReadyPcManagement';
import StoreSettingsManagement from './StoreSettingsManagement';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { signOut, profile } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      onBack();
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">KECINFORSTORE</h1>
                  <p className="text-xs text-slate-500">Painel Administrativo</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Olá, Admin</p>
                <p className="text-xs text-slate-500">{profile?.email}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={onBack}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  Voltar ao Site
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="produtos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8 gap-2 bg-white p-2 rounded-lg shadow-sm h-auto">
            {/* Seção: Catálogo */}
            <TabsTrigger 
              value="produtos" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Package className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Produtos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="categorias" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Tags className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Categorias</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="destaques" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Star className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Destaques</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="pcs-prontos" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <Computer className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">PCs Prontos</span>
            </TabsTrigger>

            {/* Seção: Aparência */}
            <TabsTrigger 
              value="banners" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              <Image className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Banners</span>
            </TabsTrigger>

            {/* Seção: Usuários */}
            <TabsTrigger 
              value="usuarios" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Usuários</span>
            </TabsTrigger>

            {/* Seção: Configurações */}
            <TabsTrigger 
              value="credenciais" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
            >
              <Shield className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Credenciais</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="configuracoes" 
              className="flex flex-col items-center justify-center p-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
            >
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Loja</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Catálogo */}
            <TabsContent value="produtos" className="mt-0">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="categorias" className="mt-0">
              <CategoryManagement />
            </TabsContent>

            <TabsContent value="destaques" className="mt-0">
              <FeaturedProductsManagement />
            </TabsContent>

            <TabsContent value="pcs-prontos" className="mt-0">
              <ReadyPcManagement />
            </TabsContent>

            {/* Aparência */}
            <TabsContent value="banners" className="mt-0">
              <BannerManagement />
            </TabsContent>

            {/* Usuários */}
            <TabsContent value="usuarios" className="mt-0">
              <UserManagement />
            </TabsContent>

            {/* Configurações */}
            <TabsContent value="credenciais" className="mt-0">
              <StoreCredentialsManagement />
            </TabsContent>

            <TabsContent value="configuracoes" className="mt-0">
              <StoreSettingsManagement />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
