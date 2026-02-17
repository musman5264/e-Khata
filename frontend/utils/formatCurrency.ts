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
