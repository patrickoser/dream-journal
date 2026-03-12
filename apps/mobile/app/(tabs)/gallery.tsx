/**
 * Vision board — masonry grid of all saved dream images.
 */
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NightSkyBackground } from '../../src/components/canvas/NightSkyBackground';
import { Colors, Typography, Spacing } from '../../src/constants/theme';
import { useSavedGenerations } from '../../src/hooks/useSavedGenerations';

const NUM_COLUMNS = 2;

export default function GalleryScreen() {
  const { width } = useWindowDimensions();
  const { images, isLoading } = useSavedGenerations();
  const imageSize = (width - Spacing.md * 3) / NUM_COLUMNS;

  return (
    <View style={styles.container}>
      <NightSkyBackground />
      <View style={styles.overlay} />

      <FlatList
        data={images}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Visions</Text>
            <Text style={styles.subtitle}>{images.length} images saved</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Your saved dream images will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.imageCell, { width: imageSize, height: imageSize }]}>
            <Image source={{ uri: item.mediaUrl }} style={styles.image} />
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 16, 0.6)',
  },
  header: {
    paddingTop: 70,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.xl,
    color: Colors.starWhite,
  },
  subtitle: {
    fontFamily: Typography.uiFontFamily,
    fontSize: Typography.xs,
    color: Colors.dusty,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageCell: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.midnight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.dreamFontFamilyItalic,
    fontSize: Typography.md,
    color: Colors.moonGlow,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: Typography.md * 1.8,
  },
});
