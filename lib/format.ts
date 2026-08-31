/**
 * Financial formatting helpers. Indian numbering system (lakh/crore) by default,
 * since RecoverAI's synthetic data is INR-denominated.
 */

/** Full precise currency, e.g. ₹2,499 or ₹18,500 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Compact Indian format, e.g. ₹82.4L, ₹1.2Cr */
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(abs % 1_00_00_000 === 0 ? 0 : 1)}Cr`
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(abs % 1_00_000 === 0 ? 0 : 1)}L`
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`
  }
  return `${sign}₹${abs.toFixed(0)}`
}

/** Percentage from a 0–1 ratio, e.g. 0.734 → 73% */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

/** Signed delta, e.g. +12.4% or -3.1% */
export function formatDelta(ratio: number, digits = 1): string {
  const value = (ratio * 100).toFixed(digits)
  return `${ratio > 0 ? '+' : ''}${value}%`
}
