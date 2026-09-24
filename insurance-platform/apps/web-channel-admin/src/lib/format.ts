/**
 * Formatting utilities for display values
 *
 * Extracted from mockDashboardData to remove mock file dependency.
 */

export function formatCurrency(value: number, short = false): string {
  if (short) {
    const B = Math.abs(value) / 1_000_000_000;
    return `${value < 0 ? '-' : ''}${B.toFixed(1)}B`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
