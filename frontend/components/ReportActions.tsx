import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Button, IconButton, Menu, Divider, Text, Portal, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

/**
 * Inject a minimal @media print stylesheet.
 * The actual print isolation is done via JavaScript in handlePrint():
 * we clone #printable-report into a top-level container and hide #root.
 */
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const printStyleId = 'ekhata-print-styles';
  if (!document.getElementById(printStyleId)) {
    const style = document.createElement('style');
    style.id = printStyleId;
    style.textContent = `
      @media print {
        /* Hide the app root when printing */
        body > #root {
          display: none !important;
        }

        /* Show only the print container injected by JS */
        body > #ekhata-print-container {
          display: block !important;
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          background: #fff !important;
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }

        body > #ekhata-print-container * {
          visibility: visible !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }

        /* Force table rows to stay together */
        body > #ekhata-print-container table,
        body > #ekhata-print-container div[role="table"] {
          page-break-inside: auto !important;
          width: 100% !important;
          table-layout: fixed !important;
        }

        body > #ekhata-print-container tr,
        body > #ekhata-print-container div[role="row"] {
          page-break-inside: avoid !important;
        }

        /* Ensure content fits A4 width */
        body > #ekhata-print-container div[style*="min-width"] {
          min-width: unset !important;
        }

        /* Scale down horizontally scrolling containers */
        body > #ekhata-print-container [style*="overflow"] {
          overflow: visible !important;
        }

        /* Shrink font sizes for print */
        body > #ekhata-print-container div[role="cell"],
        body > #ekhata-print-container div[role="columnheader"] {
          font-size: 10px !important;
          padding: 4px 2px !important;
        }

        /* Ensure all surfaces lay flat */
        body > #ekhata-print-container [class*="Surface"],
        body > #ekhata-print-container [style*="elevation"] {
          box-shadow: none !important;
          border: 1px solid #eee !important;
        }

        /* Print footer */
        .ekhata-print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 4mm 6mm;
          border-top: 1px solid #ccc;
          font-size: 9px;
          color: #666;
          text-align: center;
          background: #fff;
        }

        /* Reset backgrounds for clean print */
        body, html {
          background: #fff !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        @page {
          margin: 6mm 5mm 14mm 5mm;
          size: A4 portrait;
        }
      }

      /* Screen style: hide the print container */
      #ekhata-print-container {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }
}

export interface BusinessInfo {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
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
  /** Business info for header/footer branding */
  businessInfo?: BusinessInfo | null;
}

export default function ReportActions({
  onPrint,
  onExportPDF,
  onExportExcel,
  onShare,
  compact = false,
  contentSelector,
  reportTitle,
  businessInfo,
}: ReportActionsProps) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [shareModalVisible, setShareModalVisible] = React.useState(false);
  const [exportModalVisible, setExportModalVisible] = React.useState(false);

  /** Build a branded HTML header string */
  const buildHeaderHTML = (title?: string): string => {
    const biz = businessInfo;
    const bizName = biz?.name || 'e-Khata';
    const bizAddress = [biz?.address, biz?.city].filter(Boolean).join(', ');
    const bizPhone = biz?.phone || '';
    const bizEmail = biz?.email || '';
    const reportDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const displayTitle = title ? title.replace(/_/g, ' ') : '';

    let html = '<div style="text-align:center;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #1B2B65;">';
    html += `<h1 style="margin:0;font-size:20px;font-weight:800;color:#1B2B65;">${bizName}</h1>`;
    if (bizAddress) html += `<p style="margin:2px 0 0;font-size:10px;color:#666;">${bizAddress}</p>`;
    if (bizPhone || bizEmail) html += `<p style="margin:1px 0 0;font-size:10px;color:#666;">${[bizPhone, bizEmail].filter(Boolean).join(' | ')}</p>`;
    if (displayTitle) html += `<h3 style="margin:8px 0 0;font-size:14px;font-weight:700;color:#333;">${displayTitle}</h3>`;
    html += `<p style="margin:2px 0 0;font-size:9px;color:#888;">Generated: ${reportDate}</p>`;
    html += '</div>';
    return html;
  };

  /** Build a branded HTML footer string */
  const buildFooterHTML = (): string => {
    const bizName = businessInfo?.name || 'e-Khata';
    return `<div class="ekhata-print-footer" style="text-align:center;padding:6px 0;border-top:1px solid #ccc;margin-top:16px;font-size:9px;color:#666;">
      ${bizName} &copy; <a href="https://esystematics.com" style="color:#1B2B65;text-decoration:none;">Esystematic Technologies</a> | 0311-3999345 | 0334-5266444
    </div>`;
  };

  const handlePrint = () => {
    if (onPrint) return onPrint();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Always remove any previous print container first
      const existing = document.getElementById('ekhata-print-container');
      if (existing) existing.remove();

      // Get the CURRENT printable content from the live DOM
      const source = document.getElementById('printable-report');
      if (!source) {
        window.print();
        return;
      }

      // Create print container with FRESH cloned content
      const container = document.createElement('div');
      container.id = 'ekhata-print-container';
      container.style.cssText = 'width:100%;max-width:100%;padding:4mm 5mm;box-sizing:border-box;';

      // Add business header
      const header = document.createElement('div');
      header.innerHTML = buildHeaderHTML(reportTitle);
      container.appendChild(header);

      // Clone and clean the content
      const clone = source.cloneNode(true) as HTMLElement;
      // Remove any min-width constraints that cause horizontal overflow
      clone.style.width = '100%';
      clone.style.maxWidth = '100%';
      clone.style.overflow = 'visible';
      clone.style.boxSizing = 'border-box';
      // Remove horizontal scroll wrappers
      const scrollWrappers = clone.querySelectorAll('[style*="overflow"]');
      scrollWrappers.forEach((el) => {
        (el as HTMLElement).style.overflow = 'visible';
      });
      // Reset min-widths on table elements
      const minWidthEls = clone.querySelectorAll('[style*="min-width"]');
      minWidthEls.forEach((el) => {
        (el as HTMLElement).style.minWidth = 'unset';
      });
      // Force all flex children to not shrink beyond container
      const allEls = clone.querySelectorAll('*');
      allEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.minWidth && htmlEl.style.minWidth !== 'unset') {
          htmlEl.style.minWidth = 'unset';
        }
      });

      container.appendChild(clone);

      // Add footer
      const footer = document.createElement('div');
      footer.innerHTML = buildFooterHTML();
      container.appendChild(footer);

      document.body.appendChild(container);

      // Print, then clean up immediately after
      window.print();

      // Clean up after print dialog closes
      setTimeout(() => {
        const el = document.getElementById('ekhata-print-container');
        if (el) el.remove();
      }, 500);
    }
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (Platform.OS !== 'web') return null;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = findReportElement(contentSelector);
      if (!element) return null;

      // Wrap with header/footer for PDF
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildHeaderHTML(reportTitle);
      wrapper.appendChild(element);
      const footerDiv = document.createElement('div');
      footerDiv.innerHTML = buildFooterHTML();
      wrapper.appendChild(footerDiv);

      const title = reportTitle || document.title || 'Report';
      const opt = {
        margin: [8, 6, 12, 6] as [number, number, number, number],
        filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          ignoreElements: (el: Element) => {
            const id = (el as HTMLElement).id || '';
            return id === 'report-actions' || id === 'web-sidebar' || id === 'impersonation-banner' ||
              id === 'report-filter-card' || el.getAttribute('data-print') === 'no-print';
          },
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      return await html2pdf().set(opt).from(wrapper).outputPdf('blob');
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

        // Wrap with header/footer for PDF
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildHeaderHTML(reportTitle);
        wrapper.appendChild(element);
        const footerDiv = document.createElement('div');
        footerDiv.innerHTML = buildFooterHTML();
        wrapper.appendChild(footerDiv);

        const title = reportTitle || document.title || 'Report';
        const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        const opt = {
          margin: [8, 6, 12, 6] as [number, number, number, number],
          filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            ignoreElements: (el: Element) => {
              const id = (el as HTMLElement).id || '';
              return id === 'report-actions' || id === 'web-sidebar' || id === 'impersonation-banner' ||
                id === 'report-filter-card' || el.getAttribute('data-print') === 'no-print';
            },
          },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        };

        await html2pdf().set(opt).from(wrapper).save();
      } catch (err) {
        console.error('PDF export error:', err);
        handlePrint();
      }
    }
  };

  /** Export as CSV — extracts table data from the printable report area */
  const handleExportCSV = () => {
    if (Platform.OS !== 'web') return;
    try {
      const element = findReportElement(contentSelector);
      if (!element) {
        alert('Could not find report content to export.');
        return;
      }

      const tables = element.querySelectorAll('div[role="table"], table');
      if (tables.length === 0) {
        alert('No table data found to export as CSV.');
        return;
      }

      let csvContent = '';
      tables.forEach((table) => {
        const rows = table.querySelectorAll('div[role="row"], tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('div[role="columnheader"], div[role="cell"], th, td');
          const rowData: string[] = [];
          cells.forEach((cell) => {
            let text = (cell as HTMLElement).innerText || cell.textContent || '';
            text = text.replace(/[\n\r]+/g, ' ').trim();
            // Escape CSV: wrap in quotes if has commas/quotes
            if (text.includes(',') || text.includes('"')) {
              text = `"${text.replace(/"/g, '""')}"`;
            }
            rowData.push(text);
          });
          csvContent += rowData.join(',') + '\n';
        });
        csvContent += '\n';
      });

      const title = reportTitle || 'Report';
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Failed to export CSV.');
    }
  };

  /** Export as XLSX (using CSV approach with .xlsx content type) */
  const handleExportXLSX = () => {
    if (Platform.OS !== 'web') return;
    try {
      const element = findReportElement(contentSelector);
      if (!element) {
        alert('Could not find report content to export.');
        return;
      }

      const tables = element.querySelectorAll('div[role="table"], table');
      if (tables.length === 0) {
        alert('No table data found to export.');
        return;
      }

      // Build a simple HTML table for Excel to parse
      let htmlContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
      tables.forEach((table) => {
        htmlContent += '<table border="1">';
        const rows = table.querySelectorAll('div[role="row"], tr');
        rows.forEach((row) => {
          htmlContent += '<tr>';
          const isHeader = row.querySelector('div[role="columnheader"], th');
          const cells = row.querySelectorAll('div[role="columnheader"], div[role="cell"], th, td');
          cells.forEach((cell) => {
            const tag = isHeader ? 'th' : 'td';
            let text = (cell as HTMLElement).innerText || cell.textContent || '';
            text = text.replace(/[\n\r]+/g, ' ').trim();
            htmlContent += `<${tag}>${text}</${tag}>`;
          });
          htmlContent += '</tr>';
        });
        htmlContent += '</table>';
      });
      htmlContent += '</body></html>';

      const title = reportTitle || 'Report';
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('XLSX export error:', err);
      alert('Failed to export Excel file.');
    }
  };

  const handleExport = () => {
    setExportModalVisible(true);
  };

  const handleExportFormat = (format: 'pdf' | 'csv' | 'xlsx') => {
    setExportModalVisible(false);
    switch (format) {
      case 'pdf': handleExportPDF(); break;
      case 'csv': handleExportCSV(); break;
      case 'xlsx': handleExportXLSX(); break;
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
      try {
        const blob = await generatePDFBlob();
        const title = reportTitle || 'Report';
        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, { type: 'application/pdf' });
          const shareData = { title, text: title, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        // Fallback: share link via WhatsApp
        const text = `${title}: ${window.location.href}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      } catch (err) {
        console.error('WhatsApp share error:', err);
        const text = `${reportTitle || 'Report'}: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
      return;
    }

    if (channel === 'email') {
      try {
        const blob = await generatePDFBlob();
        const title = reportTitle || 'Report';
        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, { type: 'application/pdf' });
          const shareData = { title, files: [file] };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        }
        // Fallback: mailto link
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`Please find the report here: ${window.location.href}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      } catch (err) {
        console.error('Email share error:', err);
        const subject = encodeURIComponent(reportTitle || 'Report');
        const body = encodeURIComponent(`Please find the report here: ${window.location.href}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
      return;
    }
  };

  const handleShare = () => {
    if (onShare) return onShare();
    setShareModalVisible(true);
  };

  /** Export format picker modal */
  const exportModal = Platform.OS === 'web' && exportModalVisible ? (
    <Portal>
      <View style={shareStyles.overlay} nativeID="export-modal-overlay">
        <TouchableOpacity style={shareStyles.backdrop} onPress={() => setExportModalVisible(false)} activeOpacity={1} />
        <Surface style={shareStyles.modal}>
          <Text style={shareStyles.modalTitle}>Export Report</Text>
          <Text style={shareStyles.modalSubtitle}>Choose export format</Text>
          <Divider style={{ marginVertical: 12 }} />

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleExportFormat('pdf')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#EF444415' }]}>
              <MaterialCommunityIcons name="file-pdf-box" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>PDF</Text>
              <Text style={shareStyles.channelDesc}>Export as PDF document</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleExportFormat('csv')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#22C55E15' }]}>
              <MaterialCommunityIcons name="file-delimited-outline" size={22} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>CSV</Text>
              <Text style={shareStyles.channelDesc}>Export as comma-separated values</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleExportFormat('xlsx')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#3B82F615' }]}>
              <MaterialCommunityIcons name="file-excel-box" size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>Excel (XLS)</Text>
              <Text style={shareStyles.channelDesc}>Export as Excel spreadsheet</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <Divider style={{ marginTop: 8 }} />
          <Button mode="text" onPress={() => setExportModalVisible(false)} style={{ marginTop: 4 }}>Cancel</Button>
        </Surface>
      </View>
    </Portal>
  ) : null;

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
              <Text style={shareStyles.channelDesc}>Share PDF via WhatsApp</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={shareStyles.channelRow} onPress={() => handleShareChannel('email')}>
            <View style={[shareStyles.channelIcon, { backgroundColor: '#6366F115' }]}>
              <MaterialCommunityIcons name="email-outline" size={22} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={shareStyles.channelLabel}>Email</Text>
              <Text style={shareStyles.channelDesc}>Share PDF via email</Text>
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
            onPress={() => { setMenuVisible(false); handleExport(); }}
            title="Export"
            leadingIcon="download"
          />
          <Divider />
          <Menu.Item
            onPress={() => { setMenuVisible(false); handleShare(); }}
            title="Share"
            leadingIcon="share-variant"
          />
        </Menu>
        {shareModal}
        {exportModal}
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
        icon="download"
        onPress={handleExport}
        compact
        style={styles.btn}
        labelStyle={styles.btnLabel}
      >
        Export
      </Button>
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
      {exportModal}
    </View>
  );
}

/**
 * Find the report content element in the DOM for PDF export.
 * Priority: #printable-report → contentSelector → main content area → body
 * IMPORTANT: Always returns a FRESH clone to prevent stale element caching.
 * Also removes any previous stale print containers first.
 */
function findReportElement(contentSelector?: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  // Always clean up any previous stale print containers
  const stale = document.getElementById('ekhata-print-container');
  if (stale) stale.remove();

  let source: HTMLElement | null = null;

  // 1. Always prefer the standardized printable-report element
  const printable = document.getElementById('printable-report');
  if (printable) {
    source = printable;
  }

  // 2. Try the explicit selector if provided
  if (!source && contentSelector) {
    source = document.querySelector(contentSelector) as HTMLElement;
  }

  // 3. Find the main content area (right side of the flex-row layout)
  if (!source) {
    const rootDiv = document.getElementById('root');
    if (rootDiv) {
      const flexRow = rootDiv.firstElementChild as HTMLElement;
      if (flexRow && flexRow.children.length >= 2) {
        source = flexRow.children[1] as HTMLElement;
      } else if (flexRow) {
        source = flexRow;
      }
    }
  }

  if (!source) source = document.body;

  // Clone to prevent stale references and clean for export
  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.overflow = 'visible';
  return clone;
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
