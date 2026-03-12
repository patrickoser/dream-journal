/**
 * Entry point — redirects to onboarding or home depending on auth state.
 * On first launch, always goes to onboarding (no sign-up first approach).
 */
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { session, hasCompletedOnboarding } = useAuthStore();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/dream-prompt" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)/" />;
}
