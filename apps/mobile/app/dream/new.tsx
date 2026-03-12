/**
 * New dream entry — the main journaling + generation screen.
 * Authenticated version of the onboarding dream-prompt screen.
 * Saves entries to Supabase and supports auto-generate (premium).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { NightSkyBackground } from '../../src/components/canvas/NightSkyBackground';
import { DreamImageOverlay } from '../../src/components/canvas/DreamImageOverlay';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { useDreamSession } from '../../src/hooks/useDreamSession';

export default function NewDreamScreen() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const {
    currentImageUrl,
    savedImages,
    isGenerating,
    isAutoGenerate,
    entryId,
    generate,
    save,
    reject,
    finishEntry,
  } = useDreamSession();

  const hasImage = !!currentImageUrl;
  const canGenerate = text.trim().length > 20 && !isGenerating;

  const handleFinish = useCallback(async () => {
    Keyboard.dismiss();
    const saved = await finishEntry(text);
    if (saved) {
      queryClient.invalidateQueries({ queryKey: ['dream-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['saved-images'] });
      router.replace(`/dream/${entryId}`);
    }
  }, [text, finishEntry, entryId, queryClient]);

  return (
    <View style={styles.container}>
      <NightSkyBackground generatingProgress={isGenerating ? 1 : 0} />
      <DreamImageOverlay imageUrl={currentImageUrl} visible={hasImage} />

      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.dateLabel}>{formatDate(new Date())}</Text>

          <TextInput
            ref={inputRef}
            style={styles.dreamInput}
            value={text}
            onChangeText={setText}
            placeholder="What did you dream..."
            placeholderTextColor={Colors.dusty}
            multiline
            autoFocus
            returnKeyType="default"
            blurOnSubmit={false}
            selectionColor={Colors.starGold}
            cursorColor={Colors.starGold}
          />
        </ScrollView>

        {/* Bottom controls */}
        {text.length > 10 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.controls}>
            {!hasImage ? (
              <View style={styles.controlRow}>
                {!isAutoGenerate && (
                  <Pressable
                    style={[styles.generateButton, !canGenerate && styles.disabled]}
                    onPress={() => generate(text)}
                    disabled={!canGenerate}
                  >
                    <Text style={styles.generateText}>
                      {isGenerating ? 'Dreaming...' : '✦  Generate'}
                    </Text>
                  </Pressable>
                )}
                {isAutoGenerate && isGenerating && (
                  <Text style={styles.autoGeneratingText}>Dreaming...</Text>
                )}
                <Pressable style={styles.finishButton} onPress={handleFinish}>
                  <Text style={styles.finishText}>Save Entry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.saveRejectRow}>
                <Pressable style={styles.rejectButton} onPress={reject}>
                  <Text style={styles.rejectText}>Dissolve</Text>
                </Pressable>
                <Pressable style={styles.keepButton} onPress={save}>
                  <Text style={styles.keepText}>✦  Keep</Text>
                </Pressable>
                <Pressable style={styles.finishButton} onPress={handleFinish}>
                  <Text style={styles.finishText}>Done</Text>
                </Pressable>
              </View>
            )}

            {savedImages.length > 0 && (
              <Text style={styles.savedCount}>
                {savedImages.length} image{savedImages.length !== 1 ? 's' : ''} saved
              </Text>
            )}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  closeText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.base,
    color: Colors.moonGlow,
    opacity: 0.6,
  },
  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 70,
    paddingBottom: Spacing.xxxl,
  },
  dateLabel: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    color: Colors.dusty,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.lg,
  },
  dreamInput: {
    fontFamily: Typography.dreamFontFamily,
    fontSize: Typography.md,
    color: Colors.starWhite,
    lineHeight: Typography.md * Typography.dream,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    gap: Spacing.sm,
  },
  controlRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  generateButton: {
    flex: 1,
    backgroundColor: 'rgba(200,169,81,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200,169,81,0.4)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  generateText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.starGold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  finishButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(232,232,240,0.15)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  finishText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.moonGlow,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  saveRejectRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(232,232,240,0.12)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  rejectText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.moonGlow,
    opacity: 0.7,
  },
  keepButton: {
    flex: 1.5,
    backgroundColor: 'rgba(200,169,81,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(200,169,81,0.5)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  keepText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.starGold,
    letterSpacing: 1,
  },
  savedCount: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    color: Colors.dusty,
    textAlign: 'center',
    letterSpacing: 1,
  },
  disabled: { opacity: 0.3 },
  autoGeneratingText: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.base,
    color: Colors.moonGlow,
    opacity: 0.6,
    flex: 1,
    textAlign: 'center',
  },
});
