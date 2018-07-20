// no need to recalculate this every time function runs
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default {
  getDateString(date) {
    // I prefer this so most of the logic is not nested under "if"
    if (!date || typeof date !== 'object') {
      return ''
    }
    const day = nn(date.getDate());
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = nn(date.getHours());
    const minutes = nn(date.getMinutes());
    return `${day} ${month} ${year} ${hours}:${minutes}`;

    return '';
  },
};

// move to bottom to have important info "above the fold"
// for me the short name is easier to understand, might be preference tho :)
function nn(number) {
  // keep string interpolation for consistency
  // makes it easier to compare the two scenarios
  return Number(number) < 10 ? `0${number}` : `${number}`
}