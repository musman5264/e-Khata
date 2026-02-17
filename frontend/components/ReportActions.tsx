import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Button, IconButton, Menu, Divider, Text, Portal, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

/**
 * Inject a comprehensive @media print stylesheet once.
 * Uses aggressive selectors to hide sidebar, action buttons,
 * tab bars, and all non-report UI during print.
 */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const printStyleId = 'ekhata-print-styles';
  if (!document.getElementById(printStyleId)) {
    const style = document.createElement('style');
    style.id = printStyleId;
    style.textContent = `
      @media print {
        /* Hide sidebar by nativeID (React Native Web renders nativeID as id) */
        [id="web-sidebar"],
        [id="report-actions"],
        [id="impersonation-banner"],
        [data-testid="web-sidebar"],
        [data-print="no-print"],
        [id="share-modal-overlay"] {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          overflow: hidden !important;
        }

        /* The root layout is flex row with sidebar first — force the sidebar to collapse */
        #root > div > div:first-child {
          display: none !important;
        }

        /* Make the content area full width */
        #root > div > div {
          flex: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Reset backgrounds for clean print */
        body, html, #root, #root > div, #root > div > div {
          background: #fff !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Make everything visible (no scroll clipping) */
        * {
          overflow: visible !important;
        }

        /* Hide any fixed/absolute positioned navigation bars */
        [role="navigation"],
        [role="tablist"] {
          display: none !important;
        }

        /* Print-friendly adjustments */
        @page {
          margin: 15mm;
          size: A4 portrait;
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
  /** CSS selector for the report content element to export as PDF */
  contentSelector?: string;
  /** Report title for PDF filename */
  reportTitle?: string;
}

export default function ReportActions({
  onPrint,
  onExportPDF,
  onExportExcel,
  onShare,
  compact = false,
  contentSelector,
  reportTitle,
}: ReportActionsProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [shareModalVisible, setShareModalVisible] = React.useState(false);

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (Platform.OS === 'web') {
      window.print();
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (Platform.OS !== 'web') return null;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = findReportElement(contentSelector);
      if (!element) return null;

      const title = reportTitle || document.title || 'Report';
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          ignoreElements: (el: Element) => {
            const id = (el as HTMLElement).id || '';
            return id === 'report-actions' || id === 'web-sidebar' || id === 'impersonation-banner' ||
              el.getAttribute('data-print') === 'no-print';
          },
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      return await html2pdf().set(opt).from(element).outputPdf('blob');
    } catch (err) {
      console.error('PDF generation error:', err);
      return null;
    }
  };

  const handleExportPDF = async () => {
    if (onExportPDF) return onExportPDF();
    if (Platform.OS === 'web') {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = findReportElement(contentSelector);
        if (!element) {
          alert('Could not find report content to export.');
          return;
        }

        const title = reportTitle || document.title || 'Report';
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            ignoreElements: (el: Element) => {
              const id = (el as HTMLElement).id || '';
              return id === 'report-actions' || id === 'web-sidebar' || id === 'impersonation-banner' ||
                el.getAttribute('data-print') === 'no-print';
            },
          },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        };

        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error('PDF export error:', err);
        handlePrint();
      }
    }
  };

  const handleShareChannel = async (channel: 'whatsapp' | 'email' | 'copy' | 'native') => {
    setShareModalVisible(false);

    if (channel === 'copy') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
      return;
    }

    if (channel === 'native') {
      try {
        const blob = await generatePDFBlob();
        const title = reportTitle || document.title || 'Report';
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], filename, { type: 'application/pdf' });
          const shareData = { title, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        if (navigator.share) {
          await navigator.share({ title, url: window.location.href });
        }
      } catch (err) {
        console.error('Share error:', err);
      }
      return;
    }

    if (channel === 'whatsapp') {
      const text = `${reportTitle || 'Report'}: ${window.location.href}`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      return;
    }

    if (channel === 'email') {
      const subject = encodeURIComponent(reportTitle || 'Report');
      const body = encodeURIComponent(`Please find the report here: ${window.location.href}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      return;
    }
  };

  const handleShare = () => {
    if (onShare) return onShare();
    setShareModalVisible(true);
  };

  const shareModal = Platform.OS === 'web' && shareModalVisible ? (
    <Portal>
      <View style={shareStyles.overlay} nativeID="share-modal-overlay">
        <TouchableOpacity style={shareStyles.backdrop} onPress={() => setShareModalVisible(false)} activeOpacity={1} />
        <Surface style={shareStyles.modal}>
          <Text style={shareStyles.modalTitle}>Share Report</Text>
          <Text style={shareStyles.modalSubtitle}>Choose how you'd like to share this report</Text>
          <Divider style={{ marginVertical: 12 }} />

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleShareChannel('whatsapp')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#25D36615' }]}>
              <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>WhatsApp</Text>
              <Text style={shareStyles.channelDesc}>Share link via WhatsApp</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleShareChannel('email')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#6366F115' }]}>
              <MaterialCommunityIcons name="email-outline" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>Email</Text>
              <Text style={shareStyles.channelDesc}>Share via email with report link</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleShareChannel('native')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#F59E0B15' }]}>
              <MaterialCommunityIcons name="share-variant" size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>Share with PDF</Text>
              <Text style={shareStyles.channelDesc}>Generate PDF and share via system dialog</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleShareChannel('copy')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#8B5CF615' }]}>
              <MaterialCommunityIcons name="content-copy" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>Copy Link</Text>
              <Text style={shareStyles.channelDesc}>Copy report URL to clipboard</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <Divider style={{ marginTop: 8 }} />
          <Button mode="text" onPress={() => setShareModalVisible(false)} style={{ marginTop: 4 }}>Cancel</Button>
        </Surface>
      </View>
    </Portal>
  ) : null;

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
        {shareModal}
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
      {shareModal}
    </View>
  );
}

/**
 * Find the report content element in the DOM for PDF export.
 * Strategy: Look for known markers, then walk the DOM to find the
 * scrollable content area that contains the report tables/cards.
 */
function findReportElement(contentSelector?: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  // 1. Try the explicit selector if provided
  if (contentSelector) {
    const el = document.querySelector(contentSelector) as HTMLElement;
    if (el) return el;
  }

  // 2. Find the main content area (right side of the flex-row layout)
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    const flexRow = rootDiv.firstElementChild as HTMLElement;
    if (flexRow && flexRow.children.length >= 2) {
      // Content area is the second child (after sidebar)
      const contentArea = flexRow.children[1] as HTMLElement;
      if (contentArea) return contentArea;
    }
    // Fallback: if no flex row (mobile layout), return first child
    if (flexRow) return flexRow;
  }

  return document.body;
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

const shareStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: 400,
    maxWidth: '90%',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#fff',
    elevation: 8,
    zIndex: 10000,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2B65',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8A8FA8',
    marginTop: 4,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  channelDesc: {
    fontSize: 11,
    color: '#8A8FA8',
  },
});
