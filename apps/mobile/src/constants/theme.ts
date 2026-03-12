export const Colors = {
  // Night sky palette
  void: '#020208',        // deepest background
  navy: '#050510',        // primary background
  midnight: '#0a0a1a',    // cards / surfaces
  indigo: '#1a1a3e',      // elevated surfaces
  aurora: '#2d1b69',      // accent / highlight areas
  nebula: '#3d2280',      // brighter accent

  // Star / light elements
  starGold: '#c8a951',    // primary accent, stars, CTAs
  starWhite: '#e8e8f0',   // text, bright elements
  moonGlow: '#b8b8d0',    // secondary text
  dusty: '#6b6b8a',       // placeholder / disabled text

  // Semantic
  text: '#e8e8f0',
  textSecondary: '#b8b8d0',
  textMuted: '#6b6b8a',
  background: '#050510',
  surface: '#0a0a1a',
  surfaceElevated: '#1a1a3e',
  accent: '#c8a951',

  // Functional
  error: '#e05c6b',
  success: '#5ce0a0',
  transparent: 'transparent',
} as const;

export const Gradients = {
  skyVertical: ['#020208', '#050510', '#0a0a1a', '#1a1a3e'] as const,
  skyToAurora: ['#050510', '#0d0d28', '#1a1a3e', '#2d1b69'] as const,
  starGlow: ['rgba(200, 169, 81, 0.6)', 'rgba(200, 169, 81, 0)'] as const,
  imageDark: ['rgba(5, 5, 16, 0)', 'rgba(5, 5, 16, 0.7)', 'rgba(5, 5, 16, 0.95)'] as const,
  vignette: ['rgba(5, 5, 16, 0)', 'rgba(5, 5, 16, 0.4)'] as const,
} as const;

export const Typography = {
  // Dream text — Cormorant Garamond, elegant serif
  dreamFontFamily: 'CormorantGaramond_400Regular',
  dreamFontFamilyItalic: 'CormorantGaramond_400Regular_Italic',
  dreamFontFamilyLight: 'CormorantGaramond_300Light',

  // UI chrome — thin, modern sans
  uiFontFamily: 'DMSans_300Light',
  uiFontFamilyMedium: 'DMSans_400Regular',

  // Scale
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
  display: 48,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
  dream: 2.0,  // extra breathing room for dream text
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export const Animation = {
  // Durations (ms)
  fast: 200,
  normal: 400,
  slow: 800,
  imageFadeIn: 1500,
  starTwinkle: 3000,
  shimmerCycle: 8000,

  // Generation breathing pulse
  starPulseMin: 0.6,
  starPulseMax: 1.0,
  starPulseDuration: 2000,
} as const;

// Star field config
export const StarField = {
  count: 250,
  layers: [
    { count: 60, sizeMin: 1.5, sizeMax: 3, speedX: 0.02, speedY: 0.01, opacityMin: 0.6, opacityMax: 1.0 },
    { count: 100, sizeMin: 0.8, sizeMax: 1.8, speedX: 0.01, speedY: 0.005, opacityMin: 0.3, opacityMax: 0.7 },
    { count: 90, sizeMin: 0.3, sizeMax: 0.8, speedX: 0.005, speedY: 0.003, opacityMin: 0.1, opacityMax: 0.4 },
  ],
  twinkleFraction: 0.2,  // 20% of stars twinkle
} as const;
