/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    default: '#f8fafc',
    text: '#0f172a',
    background: '#f8fafc',
    backgroundElement: '#e2e8f0',
    backgroundSelected: '#cbd5e1',
    surfaceBackground: '#f1f5f9',
    textSecondary: '#475569',
    border: '#cbd5e1',
    accent: '#0284c7',
    accentText: '#f8fafc',
    danger: '#e11d48',
    success: '#059669',
  },
  dark: {
    default: '#020617',
    text: '#f8fafc',
    background: '#020617',
    backgroundElement: '#0f172a',
    backgroundSelected: '#1e293b',
    surfaceBackground: '#1a202c',
    textSecondary: '#94a3b8',
    border: '#334155',
    accent: '#38bdf8',
    accentText: '#020617',
    danger: '#fb7185',
    success: '#34d399',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Montserrat',
    serif: 'Montserrat',
    rounded: 'Montserrat',
    mono: 'Montserrat',
  },
  android: {
    sans: 'Montserrat',
    serif: 'Montserrat',
    rounded: 'Montserrat',
    mono: 'Montserrat',
  },
  web: {
    sans: 'Montserrat, sans-serif',
    serif: 'Montserrat, sans-serif',
    rounded: 'Montserrat, sans-serif',
    mono: 'Montserrat, monospace',
  },
  default: {
    sans: 'Montserrat',
    serif: 'Montserrat',
    rounded: 'Montserrat',
    mono: 'Montserrat',
  },
}) as {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  // Legacy support
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 128,
  eight: 256,
  nine: 512,
  ten: 1024,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * Corner radius scales for consistent rounded corners
 */
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

/**
 * Elevation/shadow scales for depth
 */
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Opacity scales for layering and depth effects
 */
export const Opacity = {
  disabled: 0.5,
  hover: 0.8,
  active: 1,
  backdrop: 0.3,
  glass: 0.15,
} as const;

/**
 * Blur radius scales for frosted glass effects
 */
export const Blur = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
} as const;

/**
 * Animation timing scales for consistent motion
 */
export const AnimationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

/**
 * Touch target sizes (minimum 44x44pt for accessibility)
 */
export const TouchTarget = {
  small: 32,
  default: 44,
  large: 52,
} as const;

/**
 * Safe area configuration
 */
export const SafeArea = Platform.select({
  ios: {
    top: 16,
    bottom: 16,
  },
  android: {
    top: 8,
    bottom: 8,
  },
  default: {
    top: 16,
    bottom: 16,
  },
}) as { top: number; bottom: number };

/**
 * Haptic feedback intensity levels
 */
export const HapticFeedback = {
  selection: 'selection',
  impact: 'impactMedium',
  notification: 'notificationSuccess',
  error: 'notificationError',
  warning: 'notificationWarning',
} as const;
