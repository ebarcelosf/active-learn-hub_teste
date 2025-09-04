import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions para migração gradual
export const db = {
  // Autenticação
  auth: {
    signUp: async (email, password, metadata) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { data, error };
    },
    
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { data, error };
    },
    
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    
    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    }
  },

  // Projetos
  projects: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      return { data, error };
    },
    
    get: async (id) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
    
    create: async (project) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      return { data, error };
    },
    
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },
    
    delete: async (id) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      return { error };
    }
  },

  // Badges
  badges: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      return { data, error };
    },
    
    grant: async (userId, badge) => {
      const { data, error } = await supabase
        .from('badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          title: badge.title,
          description: badge.desc,
          xp: badge.xp,
          icon: badge.icon
        })
        .select()
        .single();
      return { data, error };
    }
  },

  // Configurações
  settings: {
    get: async (userId) => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', userId)
        .single();
      return { data, error };
    },
    
    update: async (userId, settings) => {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      return { data, error };
    }
  }
};