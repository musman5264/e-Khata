// Currency formatting for PKR
export function formatCurrency(amount: number, symbol: string = 'Rs.'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol} ${formatted}`;
}

export function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('en-PK', {
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
