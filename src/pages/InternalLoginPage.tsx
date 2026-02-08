import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternalAuth } from '@/contexts/InternalAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const InternalLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useInternalAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Erro",
        description: "Preencha usuário e senha",
        variant: "destructive"
      });
      return;
    }

    if (password.length > 8) {
      toast({
        title: "Erro",
        description: "Senha deve ter no máximo 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await login(username.trim().toLowerCase(), password);
    
    if (result.success) {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso"
      });
      navigate('/interno/dashboard');
    } else {
      toast({
        title: "Erro no login",
        description: result.error || "Usuário ou senha inválidos",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/interno/dashboard');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Sistema Interno</CardTitle>
            <CardDescription>
              Acesso restrito para funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Máximo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 8))}
                    className="pl-10"
                    disabled={isSubmitting}
                    maxLength={8}
                    autoComplete="current-password"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {password.length}/8 caracteres
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !username || !password}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao site
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso exclusivo para funcionários autorizados
        </p>
      </div>
    </div>
  );
};

export default InternalLoginPage;
