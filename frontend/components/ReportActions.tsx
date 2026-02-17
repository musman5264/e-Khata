import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, IconButton, Menu, Divider } from 'react-native-paper';
import { colors } from '@/theme';

// Inject global print CSS once on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const printStyleId = 'ekhata-print-styles';
  if (!document.getElementById(printStyleId)) {
    const style = document.createElement('style');
    style.id = printStyleId;
    style.textContent = `
      @media print {
        /* Hide sidebar, action buttons, navigation, impersonation banner */
        #web-sidebar,
        #report-actions,
        #impersonation-banner,
        [data-testid="web-sidebar"],
        #report-actions,
        [data-print="no-print"] {
          display: none !important;
        }
        /* Reset layout so content fills the page */
        body, #root, #root > div {
          background: #fff !important;
        }
        /* Make the main content full-width */
        body * {
          overflow: visible !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

interface ReportActionsProps {
  onPrint?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onShare?: () => void;
  compact?: boolean;
  /** The CSS selector or element ref for the content to export as PDF. 
   *  If not provided, the closest scrollable parent will be used. */
  contentSelector?: string;
}

export default function ReportActions({
  onPrint,
  onExportPDF,
  onExportExcel,
  onShare,
  compact = false,
  contentSelector,
}: ReportActionsProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (Platform.OS === 'web') {
      // Tag sidebar and action buttons as no-print before printing
      tagNoPrintElements(true);
      window.print();
      // Remove tags after print dialog closes
      setTimeout(() => tagNoPrintElements(false), 500);
    }
  };

  const handleExportPDF = async () => {
    if (onExportPDF) return onExportPDF();
    if (Platform.OS === 'web') {
      try {
        // Dynamically import html2pdf.js
        const html2pdf = (await import('html2pdf.js')).default;

        // Find the report content element
        let element: HTMLElement | null = null;
        if (contentSelector) {
          element = document.querySelector(contentSelector) as HTMLElement;
        }
        if (!element) {
          // Try to find the scrollable report content area
          // Look for the closest scrollview content container
          const scrollViews = document.querySelectorAll('[data-testid*="report"], main, [role="main"]');
          if (scrollViews.length > 0) {
            element = scrollViews[0] as HTMLElement;
          }
        }
        if (!element) {
          // Fallback: grab the main content area (the right side of the layout)
          const mainContent = document.querySelector('#root > div > div:last-child') as HTMLElement;
          element = mainContent || document.body;
        }

        const title = document.title || 'Report';
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            // Ignore sidebar and action buttons
            ignoreElements: (el: Element) => {
              const id = el.id || '';
              return id === 'report-actions' || id === 'web-sidebar' || id === 'impersonation-banner' ||
                     el.getAttribute('data-print') === 'no-print';
            },
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        };

        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error('PDF export error:', err);
        // Fallback to print
        handlePrint();
      }
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
      <View style={styles.compactRow} nativeID="report-actions">
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
    <View style={styles.row} nativeID="report-actions">
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

/**
 * Tag or untag elements that should be hidden during printing.
 * The sidebar is identified by its nativeID="web-sidebar".
 */
function tagNoPrintElements(_tag: boolean) {
  // Elements are already tagged with nativeID attributes
  // The @media print CSS handles hiding them automatically
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
