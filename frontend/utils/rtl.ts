import { I18nManager, Platform } from 'react-native';

export function enableRTL(): void {
  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
    if (Platform.OS !== 'web') {
      // Requires app restart on native
      I18nManager.allowRTL(true);
    }
  }
}

export function disableRTL(): void {
  if (I18nManager.isRTL) {
    I18nManager.forceRTL(false);
    if (Platform.OS !== 'web') {
      I18nManager.allowRTL(false);
    }
  }
}

export function isRTL(): boolean {
  return I18nManager.isRTL;
}
