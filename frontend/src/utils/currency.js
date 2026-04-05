/**
 * Currency formatting utility
 * Formats amounts based on user's currency preference
 */

const CURRENCY_SYMBOLS = {
  NPR: 'रू',
  USD: '$',
  EUR: '€'
};

/**
 * Format amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (NPR, USD, EUR)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'NPR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.NPR;
  const num = parseFloat(amount || 0);
  
  // Format with locale-specific number formatting
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  // For USD and EUR, put symbol before number
  if (currency === 'USD' || currency === 'EUR') {
    return `${symbol}${formatted}`;
  }
  
  // For NPR, put symbol before number (Nepali style)
  return `${symbol} ${formatted}`;
};

/**
 * Get currency symbol only
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'NPR') => {
  return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.NPR;
};
