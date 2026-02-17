import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, IconButton, Menu, Divider } from 'react-native-paper';
import { colors } from '@/theme';

interface ReportActionsProps {
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

export default function ReportActions({
  onPrint,
  onExportPDF,
  onExportExcel,
  onShare,
  compact = false,
}: ReportActionsProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (Platform.OS === 'web') {
      window.print();
    }
  };

  const handleExportPDF = () => {
    if (onExportPDF) return onExportPDF();
    // Default: use browser print to PDF
    if (Platform.OS === 'web') {
      window.print();
    }
  };

  const handleShare = () => {
    if (onShare) return onShare();
    if (Platform.OS === 'web' && navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => {});
    } else if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={20}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => { setMenuVisible(false); handlePrint(); }}
            title="Print"
            leadingIcon="printer"
          />
          <Menu.Item
            onPress={() => { setMenuVisible(false); handleExportPDF(); }}
            title="Export PDF"
            leadingIcon="file-pdf-box"
          />
          {onExportExcel && (
            <Menu.Item
              onPress={() => { setMenuVisible(false); onExportExcel(); }}
              title="Export Excel"
              leadingIcon="file-excel-box"
            />
          )}
          <Divider />
          <Menu.Item
            onPress={() => { setMenuVisible(false); handleShare(); }}
            title="Share"
            leadingIcon="share-variant"
          />
        </Menu>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Button
        mode="outlined"
        icon="printer"
        onPress={handlePrint}
        compact
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        Print
      </Button>
      <Button
        mode="outlined"
        icon="file-pdf-box"
        onPress={handleExportPDF}
        compact
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        PDF
      </Button>
      {onExportExcel && (
        <Button
          mode="outlined"
          icon="file-excel-box"
          onPress={onExportExcel}
          compact
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          Excel
        </Button>
      )}
      <Button
        mode="outlined"
        icon="share-variant"
        onPress={handleShare}
        compact
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        Share
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  compactRow: {
    alignItems: 'flex-end',
  },
  btn: {
    borderRadius: 8,
    borderColor: '#ddd',
  },
  btnLabel: {
    fontSize: 12,
  },
});
