import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),

  urduFontFamily: Platform.select({
    ios: 'NotoNastaliqUrdu',
    android: 'NotoNastaliqUrdu',
    web: '"Noto Nastaliq Urdu", serif',
  }),

  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    body: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 34,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Typography = typeof typography;
