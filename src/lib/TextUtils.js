import Config from '../lib/Config';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  },
  getISODateFromNow(daysToAdd = 0) {
    return new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];
  },
  formatNumber(number, delimiter) {
    if (!number) return '0';
    delimiter = delimiter ? delimiter.toString() : Config.format.number.delimiter;

    let parts = String(number).split('.');
    let whole = parts[0];
    let fraction = parts.length > 1 ? '.' + parts[1] : '';
    return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) + fraction;
  },
  truncateHash(hash) {
    const HASH_TRIM_LENGTH = 6;
    if (typeof hash !== 'string' || hash.length <= HASH_TRIM_LENGTH * 2) {
      return hash;
    }
    return `${hash.slice(0, HASH_TRIM_LENGTH)}...${hash.slice(hash.length - HASH_TRIM_LENGTH)}`;
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
};

function addPrecedingZero(number) {
  return Number(number) < 10 ? `0${number}` : `${number}`;
}
