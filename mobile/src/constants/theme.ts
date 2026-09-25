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
