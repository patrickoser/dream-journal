/**
 * SCREEN 3: Sign-up — after the a-ha moment.
 * The sky darkens slightly, a gentle CTA to keep their dreams.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { NightSkyBackground } from '../../src/components/canvas/NightSkyBackground';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithApple, signInWithGoogle, hasCompletedOnboarding } = useAuthStore();

  const handleApple = async () => {
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      <NightSkyBackground />

      {/* Dark overlay for more drama */}
      <View style={styles.overlay} />

      <Animated.View entering={FadeIn.duration(1000).delay(300)} style={styles.content}>
        <Text style={styles.headline}>Keep your dreams.</Text>
        <Text style={styles.subtext}>
          Your visions are waiting.{'\n'}7 days free, then $7.99 / month.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.authButton, styles.appleButton]}
            onPress={handleApple}
            disabled={loading}
          >
            <Text style={styles.appleButtonText}>  Continue with Apple</Text>
          </Pressable>

          <Pressable
            style={[styles.authButton, styles.googleButton]}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>G  Continue with Google</Text>
          </Pressable>

          <Pressable style={styles.emailButton} onPress={handleEmail} disabled={loading}>
            <Text style={styles.emailButtonText}>Continue with email</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color={Colors.starGold} style={styles.loader} />}

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 2, 8, 0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  headline: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.xxl,
    color: Colors.starWhite,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtext: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.base,
    color: Colors.moonGlow,
    textAlign: 'center',
    lineHeight: Typography.base * 1.7,
    opacity: 0.8,
  },
  buttons: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  authButton: {
    borderRadius: 100,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  appleButton: {
    backgroundColor: Colors.starWhite,
  },
  appleButtonText: {
    fontFamily: Typography.uiFontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.navy,
    letterSpacing: 0.3,
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  googleButtonText: {
    fontFamily: Typography.uiFontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.starWhite,
    letterSpacing: 0.3,
  },
  emailButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  emailButtonText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.moonGlow,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
  loader: {
    marginTop: Spacing.md,
  },
  legal: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    color: Colors.dusty,
    textAlign: 'center',
    lineHeight: Typography.xs * 1.6,
    marginTop: Spacing.md,
  },
});
