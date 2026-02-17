import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '@/theme';

interface Props {
  children: React.ReactNode;
  maxWidth?: number;
  noPadding?: boolean;
}

/**
 * Responsive container that constrains content on web.
 * On mobile: full width. On web: centered with max-width and subtle shadow.
 */
export default function WebContainer({ children, maxWidth = 480, noPadding }: Props) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width < 600) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webOuter}>
      <View style={[styles.webInner, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

/**
 * Wide container for desktop/tablet — allows up to 1200px for dashboards/tables.
 */
export function WideContainer({ children, maxWidth = 1100 }: Props) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web' || width < 600) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webOuter}>
      <View style={[styles.wideInner, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#EEEEF2',
  },
  webInner: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.divider,
    // @ts-ignore — web-only shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 0,
  },
  wideInner: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
});
