/**
 * from zen-products repo
 */
import Decimal from 'decimal.js';

/**
 * get from the asset naming server is coming from the naming server.
 * @param {string} assetName
 */
export function getRedeemableEODTimestamp(assetName) {
  const found = getRedeemableDayData(assetName);
  if (!found) return false;
  const day = found.substr(0, 2);
  const month = found.substr(2, 2);
  const year = found.substr(4, 2);
  return Date.UTC(`20${year}`, month - 1, day, 20).toString();
}

/**
 *
 * @param {string} assetName
 */
export function getRedeemableEODTimestampHigh(assetName) {
  let found = getRedeemableDayHighData(assetName);
  if (!found) return '';
  const day = found.substr(1, 2);
  const month = found.substr(3, 2);
  const year = found.substr(5, 2);
  return Date.UTC(`20${year}`, month - 1, day, 20).toString();
}

/**
 * get from the asset naming server is coming from the naming server.
 * Format of the naming date DDMMYY
 * @param {string} assetName
 */
export function getRedeemableDayData(assetName) {
  const firstRegex = /[0-9]{6}/;
  const found = firstRegex.exec(assetName);
  if (!found) return '';
  return found[0];
}

/**
 * get from the asset naming server is coming from the naming server.
 * Format of the naming date DDMMYY
 * @param {string} assetName
 */
export function getRedeemableDayHighData(assetName) {
  const firstRegex = /H[0-9]{6}/;
  const found = firstRegex.exec(assetName);
  if (!found) return '';
  return found[0];
}

/**
 * get from the asset naming server is coming from the naming server.
 * Format of the naming date DDMMYY
 * @param {string} assetName
 */
export function getRedeemablePriceData(assetName) {
  const firstRegex = /[0-9]*$/;
  const found = firstRegex.exec(assetName);
  if (!found[0]) return '';
  return found[0];
}

/**
 * get from the asset naming server is coming from the naming server.
 * @param {string} assetName
 */
export function getRedeemableTickerData(assetName) {
  const firstRegex = /^[A-Z]*/;
  const found = firstRegex.exec(assetName);
  if (!found[0]) return '';
  return found[0];
}

/**
 * get from the asset naming server is coming from the naming server.
 * @param {string} assetName
 */
export function getRedeemablePositionData(assetName) {
  const firstRegex = /Bull|Bear/;
  const found = firstRegex.exec(assetName);
  if (!found[0]) return '';
  return found[0];
}

/**
 * Represent price from per multiples of 10 units
 * @param {(number|string)} value
 * @param {(number)} multiples
 */
export function getPrice(value, multiples = 100) {
  return new Decimal(value).dividedBy(multiples).toString();
}

