import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;

  setSession: (session: Session | null) => void;
  setOnboardingComplete: () => void;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ONBOARDING_KEY = 'reverie:onboarding_complete';

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  hasCompletedOnboarding: false,
  isLoading: true,

  setSession: (session) => set({ session }),

  setOnboardingComplete: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },

  signInWithApple: async () => {
    // Implemented in services/auth.ts — called from UI
    const { supabaseSignInWithApple } = await import('../services/auth');
    const session = await supabaseSignInWithApple();
    if (session) {
      set({ session });
      get().setOnboardingComplete();
    }
  },

  signInWithGoogle: async () => {
    const { supabaseSignInWithGoogle } = await import('../services/auth');
    const session = await supabaseSignInWithGoogle();
    if (session) {
      set({ session });
      get().setOnboardingComplete();
    }
  },

  signOut: async () => {
    const { supabase } = await import('../services/supabase');
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

// Initialize: check AsyncStorage for onboarding flag and Supabase session
export async function initAuth() {
  const [onboarded, { supabase }] = await Promise.all([
    AsyncStorage.getItem(ONBOARDING_KEY),
    import('../services/supabase'),
  ]);

  const { data: { session } } = await supabase.auth.getSession();

  useAuthStore.setState({
    session,
    hasCompletedOnboarding: onboarded === 'true',
    isLoading: false,
  });

  // Keep session in sync
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.setState({ session });
  });
}
