// Currency formatting for PKR
export function formatCurrency(amount: number | null | undefined, symbol: string = 'Rs.'): string {
  const num = Number(amount);
  if (isNaN(num) || amount == null) return `${symbol} 0.00`;
  const isNegative = num < 0;
  const absAmount = Math.abs(num);
  const formatted = absAmount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol} ${formatted}`;
}

export function formatAmount(amount: number | null | undefined): string {
  const num = Number(amount);
  if (isNaN(num) || amount == null) return '0.00';
  return Math.abs(num).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function balanceDisplay(balance: number): { text: string; type: 'Dr' | 'Cr' | '-' } {
  if (balance === 0) return { text: 'Rs. 0.00', type: '-' };
  return {
    text: `Rs. ${formatAmount(balance)}`,
    type: balance > 0 ? 'Dr' : 'Cr',
  };
}

/* ── Urdu helpers ── */
const URDU_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];

/** Convert English digits to Urdu: "1,234.00" → "۱,۲۳۴.۰۰" */
export function toUrduDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => URDU_DIGITS[parseInt(d)]);
}

/* ── Number to Urdu words (Pakistani numbering system) ── */
const URDU_ONES: string[] = [
  '', 'ایک', 'دو', 'تین', 'چار', 'پانچ', 'چھ', 'سات', 'آٹھ', 'نو',
  'دس', 'گیارہ', 'بارہ', 'تیرہ', 'چودہ', 'پندرہ', 'سولہ', 'سترہ', 'اٹھارہ', 'انیس',
  'بیس', 'اکیس', 'بائیس', 'تئیس', 'چوبیس', 'پچیس', 'چھبیس', 'ستائیس', 'اٹھائیس', 'انتیس',
  'تیس', 'اکتیس', 'بتیس', 'تینتیس', 'چونتیس', 'پینتیس', 'چھتیس', 'سینتیس', 'اڑتیس', 'انتالیس',
  'چالیس', 'اکتالیس', 'بیالیس', 'تینتالیس', 'چوالیس', 'پینتالیس', 'چھیالیس', 'سینتالیس', 'اڑتالیس', 'انچاس',
  'پچاس', 'اکیاون', 'باون', 'ترپن', 'چون', 'پچپن', 'چھپن', 'ستاون', 'اٹھاون', 'انسٹھ',
  'ساٹھ', 'اکسٹھ', 'باسٹھ', 'تریسٹھ', 'چونسٹھ', 'پینسٹھ', 'چھیاسٹھ', 'سڑسٹھ', 'اڑسٹھ', 'انہتر',
  'ستر', 'اکہتر', 'بہتر', 'تہتر', 'چوہتر', 'پچہتر', 'چھہتر', 'ستتر', 'اٹھہتر', 'اناسی',
  'اسی', 'اکیاسی', 'بیاسی', 'تراسی', 'چوراسی', 'پچاسی', 'چھیاسی', 'ستاسی', 'اٹھاسی', 'نواسی',
  'نوے', 'اکیانوے', 'بانوے', 'ترانوے', 'چورانوے', 'پچانوے', 'چھیانوے', 'ستانوے', 'اٹھانوے', 'ننانوے',
];

/**
 * Convert a whole number to Urdu words using Pakistani numbering.
 * e.g. 502300 → "پانچ لاکھ دو ہزار تین سو"
 */
export function numberToUrduWords(n: number): string {
  if (n === 0) return 'صفر';
  if (n < 0) return `منفی ${numberToUrduWords(Math.abs(n))}`;

  n = Math.floor(n);
  const parts: string[] = [];

  // ارب (arab) = 10^9
  const arab = Math.floor(n / 1_000_000_000);
  if (arab > 0) {
    parts.push(`${URDU_ONES[arab]} ارب`);
    n %= 1_000_000_000;
  }

  // کروڑ (crore) = 10^7
  const crore = Math.floor(n / 10_000_000);
  if (crore > 0) {
    parts.push(`${URDU_ONES[crore]} کروڑ`);
    n %= 10_000_000;
  }

  // لاکھ (lakh) = 10^5
  const lakh = Math.floor(n / 100_000);
  if (lakh > 0) {
    parts.push(`${URDU_ONES[lakh]} لاکھ`);
    n %= 100_000;
  }

  // ہزار (thousand) = 10^3
  const hazar = Math.floor(n / 1_000);
  if (hazar > 0) {
    parts.push(`${URDU_ONES[hazar]} ہزار`);
    n %= 1_000;
  }

  // سو (hundred)
  const sau = Math.floor(n / 100);
  if (sau > 0) {
    parts.push(`${URDU_ONES[sau]} سو`);
    n %= 100;
  }

  // Remaining 0-99
  if (n > 0) {
    parts.push(URDU_ONES[n]);
  }

  return parts.join(' ');
}

/**
 * Format amount as full Urdu words: 502300 → "پانچ لاکھ دو ہزار تین سو روپے"
 */
export function formatCurrencyUrdu(amount: number | null | undefined): string {
  const num = Number(amount);
  if (isNaN(num) || amount == null || num === 0) return 'صفر روپے';
  const absNum = Math.abs(num);
  const whole = Math.floor(absNum);
  const words = numberToUrduWords(whole);
  return `${words} روپے`;
}
