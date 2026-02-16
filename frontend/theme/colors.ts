// e-Khata Theme — Deep Blue primary, Material Design 3
export const colors = {
  primary: '#1A237E',
  primaryLight: '#534BAE',
  primaryDark: '#000051',
  onPrimary: '#FFFFFF',

  secondary: '#00897B',
  secondaryLight: '#4EBAAA',
  secondaryDark: '#005B4F',
  onSecondary: '#FFFFFF',

  credit: '#00897B',     // Green/Teal — money received
  debit: '#E53935',      // Red — money sent/owed
  neutral: '#757575',

  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FC',
  error: '#E53935',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',

  onBackground: '#333333',
  onSurface: '#333333',
  onSurfaceVariant: '#666666',
  outline: '#E0E0E0',
  divider: '#E8E8E8',

  text: '#333333',
  textSecondary: '#666666',
  textDisabled: '#BDBDBD',
  textHint: '#999999',
} as const;

export type Colors = typeof colors;
