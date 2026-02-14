import { supabase } from '@/lib/supabase';

// Chaves do localStorage usadas pelo Supabase
const SUPABASE_AUTH_KEYS = [
  'sb-qchuggfaogrkyurktwxg-auth-token',
  'supabase.auth.token',
];

/**
 * Limpa todos os dados de autenticação do localStorage
 */
function clearAuthStorage() {
  SUPABASE_AUTH_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[Auth] Failed to remove key:', key);
    }
  });
  
  // Limpa qualquer chave que comece com 'sb-' (padrão Supabase)
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('[Auth] Failed to clear Supabase auth keys');
  }
}

/**
 * Verifica se o erro é relacionado a refresh token inválido
 */
function isRefreshTokenError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('refresh token') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('token not found') ||
    errorMessage.includes('jwt expired') ||
    errorCode === 'invalid_grant' ||
    errorCode === 'bad_jwt'
  );
}

export const supabaseAuthService = {
  async signUp(email: string, password: string, metadata?: { full_name?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('[Auth] SignOut error (clearing storage anyway):', error);
    }
    // Sempre limpa o storage, mesmo se signOut falhar
    clearAuthStorage();
  },

  /**
   * Obtém a sessão atual com tratamento de erro de refresh token
   * Retorna null se a sessão for inválida (ao invés de lançar erro)
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        // Se for erro de refresh token, limpa a sessão e retorna null
        if (isRefreshTokenError(error)) {
          console.warn('[Auth] Invalid refresh token detected, clearing session');
          await this.forceSignOut();
          return null;
        }
        throw error;
      }
      
      return data.session;
    } catch (error: any) {
      // Tratamento adicional para erros não capturados
      if (isRefreshTokenError(error)) {
        console.warn('[Auth] Refresh token error in catch, clearing session');
        await this.forceSignOut();
        return null;
      }
      
      // Para outros erros, loga mas retorna null para não travar a aplicação
      console.error('[Auth] getSession error:', error);
      return null;
    }
  },

  /**
   * Obtém o usuário atual com tratamento de erro
   */
  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        if (isRefreshTokenError(error)) {
          console.warn('[Auth] Invalid token when getting user, clearing session');
          await this.forceSignOut();
          return null;
        }
        throw error;
      }
      
      return data.user;
    } catch (error: any) {
      if (isRefreshTokenError(error)) {
        await this.forceSignOut();
        return null;
      }
      
      console.error('[Auth] getUser error:', error);
      return null;
    }
  },

  /**
   * Força logout limpando storage e chamando signOut
   */
  async forceSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignora erros do signOut
    }
    clearAuthStorage();
  },

  /**
   * Inicializa a autenticação verificando se há sessão válida
   * Deve ser chamado no bootstrap da aplicação
   */
  async initializeAuth(): Promise<{ session: any; user: any } | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        if (isRefreshTokenError(error)) {
          console.warn('[Auth] Invalid session on init, clearing');
          await this.forceSignOut();
          return null;
        }
        console.error('[Auth] Init error:', error);
        return null;
      }
      
      if (!data.session) {
        return null;
      }
      
      // Verifica se o token ainda é válido obtendo o usuário
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.warn('[Auth] Session exists but user invalid, clearing');
        await this.forceSignOut();
        return null;
      }
      
      return { session: data.session, user: userData.user };
    } catch (error: any) {
      console.error('[Auth] Initialize error:', error);
      if (isRefreshTokenError(error)) {
        await this.forceSignOut();
      }
      return null;
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Trata evento de erro de token
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[Auth] Token refresh failed');
        this.forceSignOut();
      }
      
      callback(event, session);
    });
  },
};
