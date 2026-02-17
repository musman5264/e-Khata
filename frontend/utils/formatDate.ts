import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// Configurable date format — set from tenant settings at app init
let _dateFormat = 'dd MMM yyyy';
let _dateTimeFormat = 'dd MMM yyyy, hh:mm a';

/**
 * Convert moment.js format tokens to date-fns tokens.
 * moment: DD/MM/YYYY, DD MMM YYYY, YYYY-MM-DD
 * date-fns: dd/MM/yyyy, dd MMM yyyy, yyyy-MM-dd
 */
function momentToDateFns(momentFmt: string): string {
  return momentFmt
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/\bD\b/g, 'd');
  // MM and MMM are the same in both libraries
}

/**
 * Set the system-wide date format from tenant settings.
 * Call this once when the tenant is loaded/changed.
 * Accepts moment.js format strings (e.g. 'DD MMM YYYY', 'DD/MM/YYYY').
 */
export function setDateFormat(momentFormat: string) {
  const converted = momentToDateFns(momentFormat);
  _dateFormat = converted;
  _dateTimeFormat = `${converted}, hh:mm a`;
}

export function getDateFormat(): string {
  return _dateFormat;
}

export function formatDate(date: string | Date | null | undefined, fmt?: string): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, fmt || _dateFormat);
  } catch {
    return '—';
  }
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, 'hh:mm a');
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, _dateTimeFormat);
  } catch {
    return '—';
  }
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}
