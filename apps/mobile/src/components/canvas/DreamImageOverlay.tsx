/**
 * DreamImageOverlay — generated image fades in with a "mist clearing" effect.
 *
 * Technique:
 * - Image starts fully blurred (radius 30) and transparent (opacity 0)
 * - Over 1500ms: opacity rises to 0.65 AND blur reduces to 0
 * - Radial gradient vignette darkens edges so text stays readable
 * - Floating bokeh dots animate slowly over the image for ethereal feel
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  Group,
  BlurMask,
  RadialGradient,
  Circle,
  Rect,
  vec,
  useValue,
  runTiming,
  useComputedValue,
  Easing,
  LinearGradient,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as REasing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

interface BokehDot {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedX: number;
  speedY: number;
}

interface DreamImageOverlayProps {
  imageUrl: string | null;
  visible: boolean;
  height?: number;
}

const BOKEH_COUNT = 20;
const FADE_DURATION = 1500;
const BLUR_START = 30;

function buildBokeh(width: number, height: number): BokehDot[] {
  return Array.from({ length: BOKEH_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 4 + Math.random() * 12,
    opacity: 0.04 + Math.random() * 0.1,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.2,
  }));
}

export function DreamImageOverlay({ imageUrl, visible, height }: DreamImageOverlayProps) {
  const { width, height: screenHeight } = useWindowDimensions();
  const h = height ?? screenHeight;
  const image = useImage(imageUrl ?? '');

  // Reanimated shared value controls overall visibility (allows unmounting cleanly)
  const containerOpacity = useSharedValue(0);
  useEffect(() => {
    containerOpacity.value = withTiming(visible ? 1 : 0, {
      duration: FADE_DURATION,
      easing: REasing.inOut(REasing.quad),
    });
  }, [visible]);

  // Skia values for blur reduction
  const blurRadius = useValue(BLUR_START);
  useEffect(() => {
    if (visible) {
      runTiming(blurRadius, 0, { duration: FADE_DURATION, easing: Easing.out(Easing.quad) });
    } else {
      blurRadius.current = BLUR_START;
    }
  }, [visible]);

  const blur = useComputedValue(() => blurRadius.current, [blurRadius]);

  const bokeh = useMemo(() => buildBokeh(width, h), [width, h]);
  const bokehClock = useValue(0);
  useEffect(() => {
    const animate = () => {
      runTiming(bokehClock, 1, { duration: 8000, easing: Easing.linear }, () => {
        bokehClock.current = 0;
        animate();
      });
    };
    animate();
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  if (!imageUrl) return null;

  return (
    <Animated.View style={containerStyle} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Generated image */}
        {image && (
          <Group>
            <BlurMask blur={blur} style="normal" respectCTM={false} />
            <Image image={image} x={0} y={0} width={width} height={h} fit="cover" />
          </Group>
        )}

        {/* Dark vignette overlay so text remains readable */}
        <Rect x={0} y={0} width={width} height={h}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, h)}
            colors={['rgba(5,5,16,0.1)', 'rgba(5,5,16,0.5)', 'rgba(5,5,16,0.9)']}
            positions={[0, 0.5, 1]}
          />
        </Rect>

        {/* Radial edge darkening */}
        <Rect x={0} y={0} width={width} height={h}>
          <RadialGradient
            c={vec(width / 2, h / 2)}
            r={Math.max(width, h) * 0.7}
            colors={['rgba(5,5,16,0)', 'rgba(5,5,16,0.6)']}
          />
        </Rect>

        {/* Floating bokeh dots */}
        {bokeh.map((dot, i) => {
          const cx = useComputedValue(() => {
            const t = bokehClock.current;
            return ((dot.x + dot.speedX * t * width) % width + width) % width;
          }, [bokehClock]);
          const cy = useComputedValue(() => {
            const t = bokehClock.current;
            return ((dot.y + dot.speedY * t * h) % h + h) % h;
          }, [bokehClock]);

          return (
            <Group key={i}>
              <BlurMask blur={dot.radius * 0.8} style="normal" respectCTM={false} />
              <Circle cx={cx} cy={cy} r={dot.radius} color={`rgba(200,169,81,${dot.opacity})`} />
            </Group>
          );
        })}
      </Canvas>
    </Animated.View>
  );
}
