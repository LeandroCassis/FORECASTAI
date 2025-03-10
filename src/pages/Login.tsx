
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if already logged in
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o usuário e senha para continuar",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(username, password);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao sistema de S&OP"
      });
      navigate('/');
    } catch (error) {
      // Login errors are handled in the auth service
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login for testing
  const quickLogin = async (e: React.MouseEvent, testUser: string, testPass: string) => {
    e.preventDefault();
    setUsername(testUser);
    setPassword(testPass);
    setIsLoading(true);
    
    try {
      await login(testUser, testPass);
      toast({
        title: "Login automático realizado",
        description: "Login com credenciais de teste"
      });
      navigate('/');
    } catch (error) {
      console.error('Quick login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">S&OP GRUPO CLASSIC</h1>
            <p className="text-gray-500 mt-2">Faça login para acessar o sistema</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-4">Login rápido para teste:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={isLoading}
                onClick={(e) => quickLogin(e, 'admin', 'admin')}
              >
                Admin
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isLoading}
                onClick={(e) => quickLogin(e, 'rogerio.bousas', 'Rogerio123')}
              >
                Rogério
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
