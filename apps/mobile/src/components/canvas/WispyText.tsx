/**
 * WispyText — ethereal dream text renderer using React Native Skia.
 *
 * Technique:
 * 1. Each word fades in individually as text is typed
 * 2. Text is drawn twice: a blurred ghost layer (glow halo) + a sharp layer on top
 * 3. A shimmer LinearGradient mask sweeps across all text every 8 seconds
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Text,
  useFont,
  Group,
  BlurMask,
  LinearGradient,
  vec,
  useValue,
  runTiming,
  useComputedValue,
  Easing,
  Paint,
  Mask,
  Rect,
} from '@shopify/react-native-skia';
import { Colors, Typography, Animation } from '../../constants/theme';

interface WispyTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  paddingHorizontal?: number;
  paddingTop?: number;
  lineHeight?: number;
}

interface WordState {
  word: string;
  opacity: ReturnType<typeof useValue>;
  appeared: boolean;
}

const WORD_FADE_DURATION = 600;
const BLUR_RADIUS = 8;
const GLOW_OPACITY = 0.35;

export function WispyText({
  text,
  fontSize = Typography.lg,
  color = Colors.starWhite,
  paddingHorizontal = 24,
  paddingTop = 40,
  lineHeight = fontSize * Typography.dream,
}: WispyTextProps) {
  const { width } = useWindowDimensions();
  const canvasWidth = width - paddingHorizontal * 2;

  // Shimmer animation — sweeps across text periodically
  const shimmerX = useValue(-canvasWidth);
  useEffect(() => {
    const sweep = () => {
      runTiming(shimmerX, canvasWidth * 2, {
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
      }, () => {
        // Wait before next sweep
        setTimeout(() => {
          shimmerX.current = -canvasWidth;
          sweep();
        }, Animation.shimmerCycle - 2000);
      });
    };
    const timer = setTimeout(sweep, 3000); // first sweep after 3s
    return () => clearTimeout(timer);
  }, [canvasWidth]);

  // Track per-word fade-in state using a ref (stable across renders)
  const wordStatesRef = useRef<Map<string, { opacity: ReturnType<typeof useValue>, appeared: boolean }>>(new Map());

  // Split text into words and compute layout
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);

  // Ensure every word in the current text has an animated opacity value
  words.forEach((word, idx) => {
    const key = `${word}-${idx}`;
    if (!wordStatesRef.current.has(key)) {
      const opacity = useValue(0);
      wordStatesRef.current.set(key, { opacity, appeared: false });
      // Fade in this word
      runTiming(opacity, 1, { duration: WORD_FADE_DURATION, easing: Easing.out(Easing.quad) });
    }
  });

  // Simple word-wrap layout: compute (x, y) for each word
  // This is approximate — for production, a proper text measurer is needed
  const avgCharWidth = fontSize * 0.52; // rough monospace approximation
  const layout = useMemo(() => {
    const positions: { word: string; x: number; y: number; key: string }[] = [];
    let curX = 0;
    let curY = paddingTop;

    words.forEach((word, idx) => {
      const wordWidth = word.length * avgCharWidth;
      const spaceWidth = avgCharWidth * 0.5;

      if (curX + wordWidth > canvasWidth && curX > 0) {
        curX = 0;
        curY += lineHeight;
      }

      positions.push({ word, x: curX, y: curY, key: `${word}-${idx}` });
      curX += wordWidth + spaceWidth;
    });

    return positions;
  }, [words, canvasWidth, lineHeight, paddingTop, avgCharWidth]);

  const totalHeight = useMemo(() => {
    if (layout.length === 0) return 100;
    const lastY = layout[layout.length - 1].y;
    return lastY + lineHeight + paddingTop;
  }, [layout, lineHeight, paddingTop]);

  const shimmerGradientStart = useComputedValue(
    () => vec(shimmerX.current, 0),
    [shimmerX]
  );
  const shimmerGradientEnd = useComputedValue(
    () => vec(shimmerX.current + canvasWidth * 0.5, 0),
    [shimmerX]
  );

  return (
    <Canvas style={[styles.canvas, { height: totalHeight, width: width - paddingHorizontal * 2 }]}>
      {layout.map(({ word, x, y, key }) => {
        const state = wordStatesRef.current.get(key);
        if (!state) return null;
        const wordColor = useComputedValue(
          () => `rgba(232, 232, 240, ${state.opacity.current * GLOW_OPACITY})`,
          [state.opacity]
        );
        const wordColorSharp = useComputedValue(
          () => `rgba(232, 232, 240, ${state.opacity.current})`,
          [state.opacity]
        );

        return (
          <Group key={key}>
            {/* Glow halo layer */}
            <Group>
              <BlurMask blur={BLUR_RADIUS} style="normal" respectCTM={false} />
              <Text x={x} y={y} text={word} font={null} color={wordColor} size={fontSize} />
            </Group>
            {/* Sharp layer */}
            <Text x={x} y={y} text={word} font={null} color={wordColorSharp} size={fontSize} />
          </Group>
        );
      })}

      {/* Shimmer sweep overlay */}
      <Rect x={0} y={0} width={canvasWidth} height={totalHeight}>
        <LinearGradient
          start={shimmerGradientStart}
          end={shimmerGradientEnd}
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']}
        />
      </Rect>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
  },
});
