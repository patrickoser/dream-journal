import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  vec,
  useValue,
  runTiming,
  useComputedValue,
  Easing,
} from '@shopify/react-native-skia';
import { Colors, StarField, Animation } from '../../constants/theme';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkles: boolean;
  twinkleOffset: number; // phase offset so stars don't all pulse together
}

interface NightSkyBackgroundProps {
  /** 0-1: when generating, stars breathe brighter */
  generatingProgress?: number;
}

function buildStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  let twinkleCount = 0;
  const maxTwinkle = Math.floor(StarField.count * StarField.twinkleFraction);

  StarField.layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      const shouldTwinkle = twinkleCount < maxTwinkle && Math.random() < StarField.twinkleFraction;
      if (shouldTwinkle) twinkleCount++;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
        baseOpacity: layer.opacityMin + Math.random() * (layer.opacityMax - layer.opacityMin),
        twinkles: shouldTwinkle,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  });

  return stars;
}

export function NightSkyBackground({ generatingProgress = 0 }: NightSkyBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(width, height), [width, height]);

  // Master twinkle clock — animates 0→1→0 in a loop
  const twinkleClock = useValue(0);
  const generatingPulse = useValue(generatingProgress);

  useEffect(() => {
    const loop = () => {
      runTiming(twinkleClock, 1, {
        duration: Animation.starTwinkle,
        easing: Easing.inOut(Easing.sin),
      }, () => {
        runTiming(twinkleClock, 0, {
          duration: Animation.starTwinkle,
          easing: Easing.inOut(Easing.sin),
        }, loop);
      });
    };
    loop();
  }, []);

  useEffect(() => {
    if (generatingProgress > 0) {
      // Breathing pulse when generating
      const pulse = () => {
        runTiming(generatingPulse, Animation.starPulseMax, {
          duration: Animation.starPulseDuration,
          easing: Easing.inOut(Easing.sin),
        }, () => {
          runTiming(generatingPulse, Animation.starPulseMin, {
            duration: Animation.starPulseDuration,
            easing: Easing.inOut(Easing.sin),
          }, pulse);
        });
      };
      pulse();
    } else {
      generatingPulse.current = 1;
    }
  }, [generatingProgress]);

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Deep sky gradient */}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[Colors.void, Colors.navy, Colors.midnight, Colors.indigo]}
          positions={[0, 0.3, 0.7, 1]}
        />
      </Rect>

      {/* Stars */}
      <Group>
        {stars.map((star, i) => (
          <TwinklingStar
            key={i}
            star={star}
            twinkleClock={twinkleClock}
            generatingPulse={generatingPulse}
          />
        ))}
      </Group>
    </Canvas>
  );
}

interface TwinklingStarProps {
  star: Star;
  twinkleClock: ReturnType<typeof useValue>;
  generatingPulse: ReturnType<typeof useValue>;
}

function TwinklingStar({ star, twinkleClock, generatingPulse }: TwinklingStarProps) {
  const opacity = useComputedValue(() => {
    let base = star.baseOpacity;

    if (star.twinkles) {
      // Each star has a phase offset so they don't sync up
      const phase = (twinkleClock.current + star.twinkleOffset / (Math.PI * 2)) % 1;
      const twinkle = 0.4 + 0.6 * Math.sin(phase * Math.PI * 2);
      base *= twinkle;
    }

    // Brighten all stars when generating
    const pulse = generatingPulse.current;
    base = base * (0.7 + 0.3 * pulse);

    return Math.min(1, base);
  }, [twinkleClock, generatingPulse]);

  const color = useComputedValue(() => {
    const o = opacity.current;
    return `rgba(232, 232, 240, ${o})`;
  }, [opacity]);

  // Larger stars get a soft glow halo
  if (star.radius > 2) {
    return (
      <Group>
        <Circle cx={star.x} cy={star.y} r={star.radius * 3} color={`rgba(200, 169, 81, 0.06)`} />
        <Circle cx={star.x} cy={star.y} r={star.radius} color={color} />
      </Group>
    );
  }

  return <Circle cx={star.x} cy={star.y} r={star.radius} color={color} />;
}
