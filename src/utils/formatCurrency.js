import { countries } from './constants';

/**
 * Get country metadata (currency symbol, etc.) by country name
 * @param {string} country - Country name
 * @returns {Object} Country metadata with symbol, currency, rate
 */
export const getCountryMeta = (country) =>
  countries.find((c) => c.name === country) || countries[0];

/**
 * Format price with appropriate currency symbol based on country
 * @param {number} value - Price value
 * @param {string} country - Country name
 * @returns {string} Formatted price with currency symbol
 */
export const formatCurrency = (value, country) => {
  if (value == null) return "—";
  const meta = getCountryMeta(country);
  return `${meta.symbol}${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
