import { AuthError, AuthResponse, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthResult {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User;
  } | null;
  error: AuthError | null;
}

class AuthService {
  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data?.user ?? null,
      session: data?.session ?? null,
      error: error,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user ?? null,
      session: data?.session ?? null,
      error: error,
    };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data?.user ?? null,
      error: error,
    };
  }
}

export const authService = new AuthService(); 