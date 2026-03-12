/**
 * Night Sky Calendar — each star is a day with a dream entry.
 * Tap a star to view that day's dreams.
 * Tap the center "+" button to start a new dream.
 */
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { NightSkyBackground } from '../../src/components/canvas/NightSkyBackground';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { useDreamCalendar } from '../../src/hooks/useDreamCalendar';

interface StarEntry {
  date: string;        // YYYY-MM-DD
  entryId: string;
  imageCount: number;
  x: number;
  y: number;
}

export default function SkyScreen() {
  const { width, height } = useWindowDimensions();
  const { entries } = useDreamCalendar();

  // Distribute entry stars across the upper portion of the sky
  const stars: StarEntry[] = useMemo(() => {
    return entries.slice(0, 50).map((entry, i) => {
      // Deterministic pseudo-random placement using date string
      const seed = entry.date.split('-').join('');
      const rng = (n: number) => ((seed.charCodeAt(n % seed.length) * 9301 + 49297) % 233280) / 233280;
      return {
        ...entry,
        x: 40 + rng(i) * (width - 80),
        y: 60 + rng(i + 1) * (height * 0.65),
      };
    });
  }, [entries, width, height]);

  return (
    <View style={styles.container}>
      <NightSkyBackground />

      {/* Dream entry stars */}
      {stars.map((star) => (
        <Pressable
          key={star.date}
          style={[styles.entryStar, { left: star.x - 12, top: star.y - 12 }]}
          onPress={() => router.push(`/dream/${star.entryId}`)}
        >
          <View style={[styles.starGlow, { opacity: 0.4 + star.imageCount * 0.1 }]} />
          <View style={styles.starCore} />
        </Pressable>
      ))}

      {/* Header */}
      <Animated.View entering={FadeIn.duration(1000).delay(500)} style={styles.header}>
        <Text style={styles.headerTitle}>Reverie</Text>
        <Text style={styles.headerSubtitle}>
          {entries.length > 0 ? `${entries.length} dream${entries.length !== 1 ? 's' : ''} recorded` : 'Your sky awaits'}
        </Text>
      </Animated.View>

      {/* New dream button */}
      <Animated.View entering={FadeIn.duration(800).delay(800)} style={styles.newDreamContainer}>
        <Pressable style={styles.newDreamButton} onPress={() => router.push('/dream/new')}>
          <Text style={styles.newDreamText}>✦  New Dream</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.xl,
    color: Colors.starWhite,
    opacity: 0.9,
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    color: Colors.moonGlow,
    opacity: 0.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  entryStar: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.starGold,
  },
  starCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.starGold,
  },
  newDreamContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  newDreamButton: {
    backgroundColor: 'rgba(200, 169, 81, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200, 169, 81, 0.4)',
    borderRadius: 100,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  newDreamText: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.sm,
    color: Colors.starGold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
