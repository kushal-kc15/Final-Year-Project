/**
 * Currency formatting. NPR by default; respects org override.
 * Indian/SAARC grouping (lakh, crore) is the right habit for the region.
 */
const SYMBOLS = { NPR: '₨', INR: '₹', USD: '$', EUR: '€' };

export function formatCurrency(amount, currency = 'NPR', { showSymbol = true, decimals = 0 } = {}) {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return showSymbol ? `${SYMBOLS[currency] ?? ''}—` : '—';
  const sym = SYMBOLS[currency] ?? `${currency} `;
  // Indian grouping: last 3 digits, then groups of 2.
  const fixed = Math.abs(n).toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  let formattedInt;
  if (currency === 'NPR' || currency === 'INR') {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    formattedInt = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  } else {
    formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  const dec = decimals > 0 && decPart ? '.' + decPart : '';
  const sign = n < 0 ? '−' : '';
  return `${sign}${showSymbol ? sym : ''}${formattedInt}${dec}`;
}

export function formatCompact(amount, currency = 'NPR') {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return '—';
  const sym = SYMBOLS[currency] ?? `${currency} `;
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `${sym}${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${sym}${(n / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}k`;
  return `${sym}${n.toFixed(0)}`;
}

export function parseAmount(text) {
  if (text == null || text === '') return NaN;
  if (typeof text === 'number') return text;
  const cleaned = String(text).replace(/[^\d.\-]/g, '');
  return parseFloat(cleaned);
}
