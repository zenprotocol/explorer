import Config from '../lib/Config';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const timezoneDisplay = getTimezoneDisplay(new Date().getTimezoneOffset());

export default {
  getDateStringFromTimestamp(timestamp) {
    return this.getDateString(new Date(Number(timestamp)));
  },
  getDateString(date) {
    if (!date || typeof date !== 'object') {
      return '';
    }

    const day = addPrecedingZero(date.getDate());
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = addPrecedingZero(date.getHours());
    const minutes = addPrecedingZero(date.getMinutes());

    return `${day} ${month} ${year} ${hours}:${minutes} ${timezoneDisplay}`;
  },
  getTimezone() {
    return timezoneDisplay;
  },
  getISODateFromNow(daysToAdd = 0) {
    return new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];
  },
  formatNumber(number, delimiter) {
    if (!number) return '0';
    delimiter = delimiter ? delimiter.toString() : Config.format.number.delimiter;

    let parts = String(number).split('.');
    let whole = parts[0];
    let fraction = parts.length > 1 ? '.' + parts[1].substring(0, 8) : '';
    return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) + fraction;
  },
  truncateHash(hash, trimLength = 6) {
    if (typeof hash !== 'string' || hash.length <= trimLength * 2 + 3) {
      return hash;
    }
  
    const hashNoPreZeros = hash.replace(/^0{0,12}/, ''); // at most 12 zeros from start
    const difference = hash.length - hashNoPreZeros.length;
    const zerosCount = difference % 2 === 1 ? 1 : difference > 0 ? 2 : 0;
    const beginPart = hashNoPreZeros
      .slice(0, Math.max(0, trimLength - zerosCount))
      .padStart(trimLength, '0');
    const endPart = hash.slice(-1 * trimLength);
  
    return `${beginPart}...${endPart}`;
  },
  capitalize(text) {
    if (text && typeof text === 'string') {
      return text.substring(0, 1).toUpperCase() + text.substring(1);
    }
    return '';
  },
  convertToFilename(str) {
    return str
      .split(' ')
      .map(word => this.capitalize(word))
      .join('-')
      .replace(/[^a-zA-Z0-9-]/g, '');
  },
  getSingularOrPlural(count, singular, plural) {
    return count > 1 ? plural : singular;
  },
  getHtmlTitle(page, item, showSeparator = false) {
    const itemDisplay = item ? ` ${item}` : '';
    const separator = showSeparator ? ' - ' : ' ';
    return `Zen Protocol${separator}${page}${itemDisplay}`;
  },
  /**
   * Get an ordinal string (1st, 2nd, ...) from a number
   * @param {number|string} number
   */
  getOrdinal(number) {
    if (isNaN(number)) return '';

    const n = Number(number);
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return this.formatNumber(n) + (s[(v - 20) % 10] || s[v] || s[0]);
  },
};

function addPrecedingZero(number) {
  return Number(number) < 10 ? `0${number}` : `${number}`;
}

export function getTimezoneDisplay(timezoneOffset) {
  const timezoneOffsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const timezoneOffsetMinutes = Math.abs(timezoneOffsetHours * 60 - Math.abs(timezoneOffset));
  const minutesDisplay = timezoneOffsetMinutes ? `:${timezoneOffsetMinutes}` : '';

  return timezoneOffset === 0
    ? '(UTC)'
    : timezoneOffset > 0
    ? `(UTC-${timezoneOffsetHours}${minutesDisplay})`
    : `(UTC+${Math.abs(timezoneOffsetHours)}${minutesDisplay})`;
}
