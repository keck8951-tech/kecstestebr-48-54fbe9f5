import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Component, ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthErrorBoundary } from "@/contexts/AuthErrorBoundary";
import { InternalAuthProvider } from "@/contexts/InternalAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPageRoute from "./pages/AuthPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AdminPage from "./pages/AdminPage";
import TermoPage from "./pages/TermoDeGarantia";
import PCbuilderPage from "./pages/PCBuilderPage";
import InternalLoginPage from "./pages/InternalLoginPage";
import InternalDashboardPage from "./pages/InternalDashboardPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple Error Boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold mb-4">Oops! Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">Por favor, recarregue a página</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthErrorBoundary>
        <AuthProvider>
          <InternalAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPageRoute />} />
                  <Route path="/produtos" element={<ProductsPage />} />
                  <Route path="/produto/:id" element={<ProductDetailPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/termo-de-garantia" element={<TermoPage />} />
                  <Route path="/Monte-Seu-PC" element={<PCbuilderPage />} />
                  <Route path="/interno" element={<InternalLoginPage />} />
                  <Route path="/interno/dashboard" element={<InternalDashboardPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </InternalAuthProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
