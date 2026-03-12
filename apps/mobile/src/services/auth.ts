import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export async function supabaseSignInWithApple(): Promise<Session | null> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('No identity token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
  return data.session;
}

export async function supabaseSignInWithGoogle(): Promise<Session | null> {
  // Google OAuth via Supabase's built-in OAuth flow (opens browser)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'reverie://auth/callback',
    },
  });

  if (error) throw error;
  // For OAuth, session is set via the redirect handler — return null here
  return null;
}

export async function supabaseSignInWithEmail(
  email: string,
  password: string
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function supabaseSignUpWithEmail(
  email: string,
  password: string
): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session;
}
