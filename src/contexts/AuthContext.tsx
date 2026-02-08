import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isInitialized: false,
    error: null,
  });

  const isInitializedRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    let retries = 3;
    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }
        return data;
      } catch (error) {
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('❌ All profile fetch attempts failed');
          return null;
        }
      }
    }
    return null;
  }, []);

  // Initialize authentication
  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing authentication...');
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session initialization error:', error);
          throw error;
        }

        if (!mountedRef.current) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (!mountedRef.current) return;
          
          setState({
            user: session.user,
            session,
            profile,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isInitialized: true,
            error: null,
          });
        }
        
        isInitializedRef.current = true;
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (!mountedRef.current) return;
        
        setState({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Failed to initialize authentication',
        });
        isInitializedRef.current = true;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;
        
        // Skip if not initialized yet (initial load handles it)
        if (!isInitializedRef.current) return;

        console.log(`🔄 Auth state changed: ${event}`);

        if (event === 'SIGNED_OUT' || !session) {
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            error: null,
          }));
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            isLoading: false,
          }));
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // Update user/session synchronously
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            isLoading: true,
          }));
          
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            if (!mountedRef.current) return;
            // Wait for profile trigger
            await new Promise(resolve => setTimeout(resolve, 1500));
            const profile = await fetchProfile(session.user.id);
            if (!mountedRef.current) return;
            setState(prev => ({
              ...prev,
              profile,
              isLoading: false,
            }));
          }, 0);
        }
      }
    );

    // THEN initialize
    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Auth methods
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
        }
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Erro inesperado ao fazer login';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, phone?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (password.length < 6) {
        const errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            setor: 'varejo',
            phone: phone?.trim() || '',
          },
        },
      });

      if (error) {
        let errorMessage = 'Erro ao criar conta';
        if (error.message.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Email inválido';
        }
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = 'Erro inesperado ao criar conta';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        const errorMessage = 'Erro ao fazer login com Google';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Erro inesperado ao fazer login com Google';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signOut();

      if (error) {
        const errorMessage = 'Erro ao fazer logout';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = 'Erro inesperado ao fazer logout';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refetchProfile = useCallback(async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id);
      setState(prev => ({ ...prev, profile }));
    }
  }, [state.user, fetchProfile]);

  const contextValue: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
    refetchProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
