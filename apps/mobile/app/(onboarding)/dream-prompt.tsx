/**
 * SCREEN 1 + 2: The onboarding a-ha experience.
 *
 * User sees only the night sky and a single question.
 * They type, images generate, no sign-up required (5 free generations).
 * After using their free generations, they're gently nudged to sign up.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { NightSkyBackground } from '../../src/components/canvas/NightSkyBackground';
import { DreamImageOverlay } from '../../src/components/canvas/DreamImageOverlay';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { useGenerationStore } from '../../src/store/generationStore';

const FREE_GENERATIONS = 5;
const PROMPT_TEXT = "What did you dream last night?";

export default function DreamPromptScreen() {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const {
    currentImageUrl,
    isGenerating,
    freeGenerationsUsed,
    generateImage,
    saveCurrentImage,
    rejectCurrentImage,
  } = useGenerationStore();

  const remaining = FREE_GENERATIONS - freeGenerationsUsed;
  const hasImage = !!currentImageUrl;
  const canGenerate = text.trim().length > 20 && remaining > 0 && !isGenerating;

  // Prompt fades in after 800ms
  const promptOpacity = useSharedValue(0);
  useEffect(() => {
    promptOpacity.value = withDelay(800, withTiming(1, { duration: 1200 }));
  }, []);

  const promptStyle = useAnimatedStyle(() => ({ opacity: promptOpacity.value }));

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    Keyboard.dismiss();
    await generateImage(text);
  }, [text, canGenerate, generateImage]);

  const handleSave = useCallback(() => {
    saveCurrentImage();
    if (remaining <= 1) {
      // Last free generation used — go to sign-up
      setTimeout(() => router.push('/(onboarding)/sign-up'), 800);
    }
  }, [saveCurrentImage, remaining]);

  const handleReject = useCallback(() => {
    rejectCurrentImage();
  }, [rejectCurrentImage]);

  const handleSignUp = useCallback(() => {
    router.push('/(onboarding)/sign-up');
  }, []);

  return (
    <View style={styles.container}>
      {/* Night sky — always full screen */}
      <NightSkyBackground generatingProgress={isGenerating ? 1 : 0} />

      {/* Generated image fades in behind everything */}
      <DreamImageOverlay imageUrl={currentImageUrl} visible={hasImage} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Prompt question */}
        <Animated.View style={[styles.promptContainer, promptStyle]}>
          <Text style={styles.promptText}>{PROMPT_TEXT}</Text>
        </Animated.View>

        {/* Dream text input */}
        <TextInput
          ref={inputRef}
          style={styles.dreamInput}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Begin here..."
          placeholderTextColor={Colors.dusty}
          multiline
          autoFocus
          returnKeyType="default"
          blurOnSubmit={false}
          selectionColor={Colors.starGold}
          cursorColor={Colors.starGold}
        />

        {/* Controls — show after user has typed something */}
        {text.length > 10 && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.controls}>
            {!hasImage ? (
              /* Generate button */
              <Pressable
                style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
                onPress={handleGenerate}
                disabled={!canGenerate}
              >
                <Text style={styles.generateButtonText}>
                  {isGenerating
                    ? 'Dreaming...'
                    : remaining > 0
                    ? `Generate  ·  ${remaining} remaining`
                    : 'No generations left'}
                </Text>
              </Pressable>
            ) : (
              /* Save / Reject after image appears */
              <Animated.View entering={FadeIn.duration(800)} style={styles.saveRejectRow}>
                <Pressable style={styles.rejectButton} onPress={handleReject}>
                  <Text style={styles.rejectButtonText}>Dissolve</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>✦  Keep this dream</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Sign-up nudge after 2 uses */}
            {freeGenerationsUsed >= 2 && remaining > 0 && (
              <Animated.View entering={FadeIn.duration(800)} style={styles.nudge}>
                <Pressable onPress={handleSignUp}>
                  <Text style={styles.nudgeText}>
                    Save your dreams forever  ›
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xxl,
  },
  promptContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.xl,
    color: Colors.starWhite,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: Typography.xl * Typography.dream,
  },
  dreamInput: {
    fontFamily: Typography.dreamFontFamily,
    fontSize: Typography.md,
    color: Colors.starWhite,
    lineHeight: Typography.md * Typography.dream,
    minHeight: 120,
    maxHeight: 280,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    textAlignVertical: 'top',
    opacity: 0.9,
  },
  controls: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  generateButton: {
    backgroundColor: 'rgba(200, 169, 81, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.5)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.4,
  },
  generateButtonText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.starGold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  saveRejectRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(232, 232, 240, 0.2)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.moonGlow,
    letterSpacing: 0.8,
  },
  saveButton: {
    flex: 2,
    backgroundColor: 'rgba(200, 169, 81, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.6)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.starGold,
    letterSpacing: 0.8,
  },
  nudge: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  nudgeText: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.base,
    color: Colors.moonGlow,
    opacity: 0.7,
  },
});
