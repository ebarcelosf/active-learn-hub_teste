import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, db } from '../lib/supabase';

const AuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Verificar sessão atual
    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { user } = await db.auth.getUser();
      if (user) {
        setUser(user);
        await loadProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await db.auth.signIn(email, password);
    if (error) throw error;
    return data;
  };

  const signup = async ({ name, email, password, role = 'Aluno' }) => {
    // 1. Criar usuário no Supabase Auth
    const { data, error } = await db.auth.signUp(email, password, {
      name,
      role
    });
    
    if (error) throw error;

    // 2. Criar perfil
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          name,
          role
        });
      
      if (profileError) throw profileError;

      // 3. Criar configurações padrão
      await supabase
        .from('user_settings')
        .insert({
          id: data.user.id
        });
    }

    return data;
  };

  const logout = async () => {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
}