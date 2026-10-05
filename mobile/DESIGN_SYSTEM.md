# Design System Guide

This document outlines the design system used throughout the mobile app. All visual design decisions are centralized in design tokens for consistency, maintainability, and scalability.

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Borders & Shadows](#borders--shadows)
7. [Effects](#effects)
8. [Animation](#animation)
9. [Accessibility](#accessibility)
10. [Best Practices](#best-practices)
11. [Component Integration](#component-integration)

---

## Overview

The design system is built on the principle of **centralized token management**. All design values (colors, sizes, timing) are stored in `@/constants/theme.ts` and imported as needed throughout the app.

**Key Benefits:**
- **Consistency** - Same values used everywhere
- **Maintainability** - Change tokens once, update everywhere
- **Type Safety** - Full TypeScript support
- **Dark Mode** - Automatic light/dark theme switching
- **Platform Awareness** - iOS/Android specific values

**Location:** `mobile/src/constants/theme.ts`

---

## Design Tokens

All design tokens are categorized into logical groups:

### Token Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Colors** | Color palette for light/dark modes | text, background, accent |
| **Fonts** | Typography configuration | sans, serif, mono |
| **Spacing** | Size scales for margins/padding | xs (4px) → 2xl (32px) |
| **BorderRadius** | Corner radius scales | xs (4px) → full (999px) |
| **Shadows** | Elevation shadows | sm, md, lg |
| **Opacity** | Transparency scales | disabled, hover, active, backdrop, glass |
| **Blur** | Blur radius for glass effects | sm (4px) → 2xl (20px) |
| **AnimationDuration** | Timing for animations | fast (150ms) → verySlow (800ms) |
| **TouchTarget** | Minimum touch sizes | small, default (44pt), large |
| **SafeArea** | Platform-specific safe areas | iOS/Android insets |

---

## Color System

### Light & Dark Themes

Colors are defined as theme objects with `light` and `dark` variants:

```typescript
import { Colors } from '@/constants/theme';

const lightColors = Colors.light; // { text: '#0f172a', ... }
const darkColors = Colors.dark;   // { text: '#f8fafc', ... }
```

### Using Colors with the Theme Hook

Always use the `useTheme()` hook to get the current theme colors:

```typescript
import { useTheme } from '@/hooks';

export function MyComponent() {
  const colors = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### Color Tokens

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| **text** | Primary text color | #0f172a | #f8fafc |
| **textSecondary** | Secondary/muted text | #475569 | #94a3b8 |
| **background** | Main background | #f8fafc | #020617 |
| **surfaceBackground** | Surface/card background | #f1f5f9 | #1a202c |
| **backgroundElement** | Element backgrounds | #e2e8f0 | #0f172a |
| **backgroundSelected** | Selected state | #cbd5e1 | #1e293b |
| **border** | Border/divider color | #cbd5e1 | #334155 |
| **accent** | Primary brand color | #0284c7 | #38bdf8 |
| **accentText** | Text on accent | #f8fafc | #020617 |
| **danger** | Error/destructive | #e11d48 | #fb7185 |
| **success** | Success state | #059669 | #34d399 |

---

## Typography

### Font Families

Platform-specific font configurations:

```typescript
import { Fonts } from '@/constants/theme';

// iOS: Montserrat
// Android: Montserrat (via React Native defaults)
// Web: Montserrat

// Access fonts:
const fontSize = Fonts.sans; // Returns font family name
```

### Font Sizes (Recommended)

Use consistent font sizes throughout:

- **xs**: 10pt - Captions, labels
- **sm**: 11pt - Secondary text
- **base**: 12pt - Body text
- **lg**: 14pt - Subheadings
- **xl**: 16pt - Headings
- **2xl**: 20pt - Major headings
- **3xl**: 24pt - Page titles

---

## Spacing

### Spacing Scale

Consistent spacing values for margins, padding, and gaps:

```typescript
import { Spacing } from '@/constants/theme';

// Values (in pixels)
Spacing.xs     // 4px
Spacing.sm     // 8px
Spacing.md     // 12px
Spacing.lg     // 16px
Spacing.xl     // 20px
Spacing.2xl    // 24px
Spacing.3xl    // 28px
Spacing.4xl    // 32px
Spacing.5xl    // 36px
Spacing.6xl    // 40px
```

### Usage Example

```typescript
import { useTheme } from '@/hooks';
import { Spacing } from '@/constants/theme';

export function Card() {
  const colors = useTheme();
  
  return (
    <View style={{
      backgroundColor: colors.surfaceBackground,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.md,
    }}>
      <Text>Card content</Text>
    </View>
  );
}
```

---

## Borders & Shadows

### Border Radius

Corner radius scales for different use cases:

```typescript
import { BorderRadius } from '@/constants/theme';

BorderRadius.xs     // 4px - Subtle rounding
BorderRadius.sm     // 8px - Small elements
BorderRadius.md     // 12px - Cards, inputs
BorderRadius.lg     // 16px - Larger components
BorderRadius.xl     // 20px - Large cards
BorderRadius['2xl'] // 24px - Extra rounded
BorderRadius.full   // 999px - Circles, pills
```

### Shadows

Pre-configured elevation shadows:

```typescript
import { Shadows } from '@/constants/theme';

export function Card() {
  return (
    <View style={{
      backgroundColor: '#fff',
      ...Shadows.md, // Spread shadow properties
      borderRadius: BorderRadius.lg,
    }}>
      Content
    </View>
  );
}
```

**Shadow Levels:**
- **sm** - Subtle elevation (cards, modals)
- **md** - Medium elevation (floating actions)
- **lg** - High elevation (overlays, dialogs)

**Shadow Properties (per level):**
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2, // Android equivalent
}
```

---

## Effects

### Opacity Scales

Predefined opacity values for layering and states:

```typescript
import { Opacity } from '@/constants/theme';

Opacity.disabled   // 0.5 - Disabled states
Opacity.hover      // 0.8 - Hover effects
Opacity.active     // 1.0 - Active/full opacity
Opacity.backdrop   // 0.3 - Modal backdrops
Opacity.glass      // 0.15 - Frosted glass effects
```

### Blur Effects

Blur radius scales for glass-morphism effects:

```typescript
import { Blur } from '@/constants/theme';

Blur.sm      // 4px
Blur.md      // 8px
Blur.lg      // 12px
Blur.xl      // 16px
Blur['2xl']  // 20px
```

### Usage Example

```typescript
export function GlassCard() {
  return (
    <BlurView
      intensity={Blur.md}
      style={{
        opacity: Opacity.glass,
        padding: Spacing.lg,
      }}
    >
      Frosted content
    </BlurView>
  );
}
```

---

## Animation

### Animation Duration

Predefined timing for consistent motion:

```typescript
import { AnimationDuration } from '@/constants/theme';

AnimationDuration.fast     // 150ms - Quick feedback
AnimationDuration.normal   // 300ms - Standard transitions
AnimationDuration.slow     // 500ms - Attention-grabbing
AnimationDuration.verySlow // 800ms - Dramatic effects
```

### Usage Example

```typescript
import { Animated } from 'react-native';
import { AnimationDuration } from '@/constants/theme';

export function FadeInView() {
  const opacity = new Animated.Value(0);
  
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: AnimationDuration.normal,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View style={{ opacity }}>
      Content
    </Animated.View>
  );
}
```

---

## Accessibility

### Touch Targets

Minimum touch target sizes to meet accessibility guidelines:

```typescript
import { TouchTarget } from '@/constants/theme';

TouchTarget.small   // 32pt - Compact layouts
TouchTarget.default // 44pt - Standard (recommended minimum)
TouchTarget.large   // 52pt - Easily tappable
```

### Best Practice

Always use at least `TouchTarget.default` for interactive elements:

```typescript
<Pressable
  style={{
    minWidth: TouchTarget.default,
    minHeight: TouchTarget.default,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <Text>Tap me</Text>
</Pressable>
```

### Safe Areas

Platform-specific safe area handling for notches, status bars, etc.:

```typescript
import { useSafeArea } from '@/hooks';

export function ScreenContent() {
  const { top, bottom } = useSafeArea();
  
  return (
    <ScrollView
      contentInset={{ top, bottom }}
      scrollIndicatorInsets={{ top, bottom }}
    >
      Content
    </ScrollView>
  );
}
```

**Default Values:**
- **iOS**: 16pt top, 16pt bottom
- **Android**: 8pt top, 8pt bottom

---

## Best Practices

### 1. Import Patterns

```typescript
// ✅ GOOD: Import from constants and hooks
import { useTheme, useSafeArea } from '@/hooks';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

// ❌ AVOID: Hardcoding color values
const styles = { backgroundColor: '#0284c7' };

// ❌ AVOID: Scattered magic numbers
const padding = 16; // Use Spacing.lg instead
```

### 2. Theme-Aware Components

Always use `useTheme()` for colors:

```typescript
// ✅ GOOD: Dynamic colors based on theme
export function Button() {
  const colors = useTheme();
  return (
    <Pressable style={{ backgroundColor: colors.accent }}>
      <Text style={{ color: colors.accentText }}>Press</Text>
    </Pressable>
  );
}

// ❌ AVOID: Static colors
export function Button() {
  return (
    <Pressable style={{ backgroundColor: '#0284c7' }}>
      <Text style={{ color: 'white' }}>Press</Text>
    </Pressable>
  );
}
```

### 3. Spacing Consistency

Use the spacing scale for all dimensions:

```typescript
// ✅ GOOD: Consistent spacing
<View style={{ paddingHorizontal: Spacing.lg, marginVertical: Spacing.md }}>
  {children}
</View>

// ❌ AVOID: Mixed spacing values
<View style={{ paddingHorizontal: 16, marginVertical: 10 }}>
  {children}
</View>
```

### 4. Shadow Application

Use predefined shadows instead of creating custom ones:

```typescript
// ✅ GOOD: Predefined shadow
<View style={Shadows.md}>Content</View>

// ❌ AVOID: Custom shadow definitions
<View style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}}>
  Content
</View>
```

### 5. Animation Timing

Use token values for all animations:

```typescript
// ✅ GOOD: Token-based timing
Animated.timing(value, {
  duration: AnimationDuration.normal,
  useNativeDriver: true,
}).start();

// ❌ AVOID: Magic numbers
Animated.timing(value, {
  duration: 300, // Where does 300 come from?
  useNativeDriver: true,
}).start();
```

---

## Component Integration

### Creating a Styled Card Component

Here's an example of a well-designed component using the design system:

```typescript
import { View, Pressable, Text } from 'react-native';
import { useTheme } from '@/hooks';
import { 
  Spacing, 
  BorderRadius, 
  Shadows,
  Opacity,
  AnimationDuration 
} from '@/constants/theme';

interface CardProps {
  title: string;
  onPress?: () => void;
}

export function Card({ title, onPress }: CardProps) {
  const colors = useTheme();
  const [pressed, setPressedState] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressedState(true)}
      onPressOut={() => setPressedState(false)}
      style={{
        marginBottom: Spacing.lg,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surfaceBackground,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          ...Shadows.md,
          opacity: pressed ? Opacity.hover : Opacity.active,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: Spacing.sm,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Card description or content
        </Text>
      </View>
    </Pressable>
  );
}
```

### Styling Page Layouts

```typescript
import { useTheme, useSafeArea } from '@/hooks';
import { Spacing } from '@/constants/theme';

export function MyPage() {
  const colors = useTheme();
  const { top, bottom } = useSafeArea();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: top,
        paddingBottom: bottom,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.lg,
        }}
      >
        {/* Page content */}
      </ScrollView>
    </View>
  );
}
```

---

## File Structure

```
mobile/
├── src/
│   ├── constants/
│   │   └── theme.ts          # All design tokens
│   ├── hooks/
│   │   ├── use-theme.ts      # Get current theme colors
│   │   ├── use-safe-area.ts  # Get safe area insets
│   │   └── index.ts          # Export all hooks
│   └── components/
│       └── ...               # Components using tokens
└── ...
```

---

## Summary

The design system provides:

✅ **Centralized tokens** - Single source of truth  
✅ **Type safety** - Full TypeScript support  
✅ **Dark mode** - Automatic theme switching  
✅ **Accessibility** - Built-in touch targets and safe areas  
✅ **Consistency** - Unified design language  
✅ **Scalability** - Easy to add new tokens  

Always use design tokens instead of hardcoded values. This keeps the app maintainable, consistent, and easy to theme in the future.

---

**Last Updated:** 2024  
**Version:** 1.0
