import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InternalUser {
  id: string;
  username: string;
  fullName: string;
  role: {
    id: string;
    name: string;
    is_master: boolean;
  } | null;
  isMaster: boolean;
}

interface InternalAuthContextType {
  user: InternalUser | null;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMaster: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (key: string) => boolean;
  refreshSession: () => Promise<void>;
}

const InternalAuthContext = createContext<InternalAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'internal_auth_token';

export const InternalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<InternalUser | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setPermissions({});
  }, []);

  const validateToken = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('internal-auth', {
        body: { action: 'validate', token }
      });

      if (error || !data?.valid) {
        clearSession();
        return false;
      }

      setUser(data.user);
      setPermissions(data.permissions || {});
      return true;
    } catch (err) {
      console.error('Token validation error:', err);
      clearSession();
      return false;
    }
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      await validateToken(token);
    }
    setIsLoading(false);
  }, [validateToken]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('internal-auth', {
        body: { action: 'login', username, password }
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Erro ao conectar ao servidor' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Erro desconhecido' };
      }

      localStorage.setItem(STORAGE_KEY, data.token);
      setUser(data.user);
      setPermissions(data.permissions || {});
      
      return { success: true };
    } catch (err) {
      console.error('Login exception:', err);
      return { success: false, error: 'Erro ao fazer login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      try {
        await supabase.functions.invoke('internal-auth', {
          body: { action: 'logout', token }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    clearSession();
  };

  const hasPermission = (key: string): boolean => {
    if (user?.isMaster) return true;
    return permissions[key] === true;
  };

  return (
    <InternalAuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated: !!user,
        isMaster: user?.isMaster || false,
        login,
        logout,
        hasPermission,
        refreshSession
      }}
    >
      {children}
    </InternalAuthContext.Provider>
  );
};

export const useInternalAuth = () => {
  const context = useContext(InternalAuthContext);
  if (context === undefined) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};
