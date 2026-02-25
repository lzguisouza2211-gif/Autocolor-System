import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Recupera usuário do localStorage ao iniciar
    const stored = localStorage.getItem('ac_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const refreshInterval = useRef<number | null>(null);

  useEffect(() => {
    // Função para atualizar usuário e persistir no localStorage
    const updateUser = (user: User | null) => {
      setUser(user);
      if (user) {
        localStorage.setItem('ac_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('ac_user');
      }
    };

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUser(session?.user ?? null);
    });

    // Intervalo para renovar sessão periodicamente (a cada 9 minutos)
    refreshInterval.current = window.setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        updateUser(session.user);
      } else {
        updateUser(null);
      }
    }, 9 * 60 * 1000); // 9 minutos

    return () => {
      subscription.unsubscribe();
      if (refreshInterval.current) window.clearInterval(refreshInterval.current);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('ac_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
