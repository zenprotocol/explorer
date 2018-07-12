export default {
  getDateString(date) {
    if (date && typeof date === 'object') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}`;
    }

    return '';
  },
};
