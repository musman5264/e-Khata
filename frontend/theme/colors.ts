// e-Khata Theme — Premium Modern Design
export const colors = {
  // Primary — Rich indigo with depth
  primary: '#1B2B65',
  primaryLight: '#3D5AF1',
  primaryDark: '#0D1B3E',
  onPrimary: '#FFFFFF',

  // Secondary — Vibrant teal
  secondary: '#00B894',
  secondaryLight: '#55EFC4',
  secondaryDark: '#00805A',
  onSecondary: '#FFFFFF',

  // Semantic — Ledger colors
  credit: '#00B894',     // Green — money received  (Jama / Cr)
  debit: '#FF6B6B',      // Soft red — money owed   (Naam / Dr)
  neutral: '#A0A4B8',

  // Surfaces
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F9',
  cardBg: '#FFFFFF',

  // Status
  error: '#FF4757',
  warning: '#FFA502',
  success: '#2ED573',
  info: '#3D5AF1',

  // Text hierarchy
  onBackground: '#1A1D2E',
  onSurface: '#1A1D2E',
  onSurfaceVariant: '#5A5E76',
  text: '#1A1D2E',
  textSecondary: '#6C7293',
  textDisabled: '#C8CAD8',
  textHint: '#9A9DB5',

  // Borders & dividers
  outline: '#E4E6F0',
  divider: '#ECEEF5',

  // Gradients (use in LinearGradient or as CSS)
  gradientStart: '#1B2B65',
  gradientEnd: '#3D5AF1',

  // Accent highlights
  accentPink: '#FF6B81',
  accentOrange: '#FF9F43',
  accentPurple: '#A29BFE',
  accentYellow: '#FFEAA7',
} as const;

export type Colors = typeof colors;
