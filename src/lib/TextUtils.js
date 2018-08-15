import Config from '../lib/Config';

function addPrecedingZero(number) {
  if (Number(number) < 10) {
    return `0${number}`;
  }
  return String(number);
}

export default {
  getDateStringFromTimestamp(timestamp) {
    return this.getDateString(new Date(Number(timestamp)));
  },
  getDateString(date) {
    if (date && typeof date === 'object') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = addPrecedingZero(date.getDate());
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = addPrecedingZero(date.getHours());
      const minutes = addPrecedingZero(date.getMinutes());
      
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    }

    return '';
  },
  formatNumber(number, delimiter) {
    if(!number) return '0';
    delimiter = delimiter? delimiter.toString() : Config.format.number.delimiter;

    let parts = String(number).split('.');
    let whole = parts[0];
    let fraction = (parts.length > 1)? '.' + parts[1] : '';
    return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) + fraction;
  },
  truncateHash(hash) {
    const HASH_TRIM_LENGTH = 6;
    if (hash.length > HASH_TRIM_LENGTH * 2) {
      return `${hash.slice(0, HASH_TRIM_LENGTH)}...${hash.slice(hash.length - HASH_TRIM_LENGTH)}`;
    }
    return hash;
  },
};
