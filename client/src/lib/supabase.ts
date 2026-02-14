import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Environment variables for Supabase
// In Vite, use import.meta.env.VITE_* for client-side variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ FIX: Cria cliente dummy para produção quando variáveis estão ausentes
const createDummyClient = (errorMessage: string) => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error(errorMessage) }),
      getUser: async () => ({ data: { user: null }, error: new Error(errorMessage) }),
      signIn: async () => ({ data: null, error: new Error(errorMessage) }),
      signUp: async () => ({ data: null, error: new Error(errorMessage) }),
      signOut: async () => ({ error: new Error(errorMessage) }),
      onAuthStateChange: () => ({ 
        data: { 
          subscription: { 
            unsubscribe: () => console.log('[Supabase] Dummy unsubscribe') 
          } 
        } 
      }),
    },
    from: () => ({
      select: () => ({ data: null, error: new Error(errorMessage) }),
      insert: () => ({ data: null, error: new Error(errorMessage) }),
      update: () => ({ data: null, error: new Error(errorMessage) }),
      delete: () => ({ data: null, error: new Error(errorMessage) }),
    }),
    functions: {
      invoke: async () => ({ data: null, error: new Error(errorMessage) }),
    },
  } as any;
};

// Validate environment variables
let supabaseClient: any;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = import.meta.env.PROD
    ? 'Application configuration error. Please contact support.'
    : 'Supabase credentials missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\nCheck SETUP_SUPABASE.md for instructions.';
  
  console.error('[Supabase] Missing environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD
  });
  
  // ✅ FIX: Em produção, usa cliente dummy ao invés de quebrar
  if (import.meta.env.PROD) {
    console.error('[Supabase] CRITICAL: Missing credentials in production! Using dummy client.');
    supabaseClient = createDummyClient(errorMessage);
  } else {
    throw new Error(errorMessage);
  }
} else {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Configuração de storage para melhor controle
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.warn('[Supabase] Storage getItem error:', e);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('[Supabase] Storage setItem error:', e);
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('[Supabase] Storage removeItem error:', e);
          }
        },
      },
    },
  });
  
  // Log de inicialização bem-sucedida
  console.log('[Supabase] Client initialized successfully');
}

export const supabase = supabaseClient;
