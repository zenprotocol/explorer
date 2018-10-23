const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;
const ADDRESS_PREPENDS = ['zen', 'zen1', 'czen', 'czen1', 'tzn', 'tzn1', 'ctzn', 'ctzn1'];

export default {
  validateSearchString(searchString) {
    return (
      searchString &&
      searchString.length >= 3 &&
      !NOT_VALID_REGEX.test(searchString) &&
      !ADDRESS_PREPENDS.includes(searchString) &&
      ADDRESS_PREPENDS.reduce(
        (valid, cur) =>
          valid &&
          cur.substring(0, 3) !== searchString &&
          (!searchString.startsWith(cur) || searchString.length >= 7),
        true
      )
    );
  },
  isCompleteAddress(searchString) {
    return searchString.indexOf('zen1') === 0 && searchString.length === 63;
  },
  formatSearchString(searchString) {
    return String(searchString)
      .replace(NOT_VALID_REGEX, '')
      .toLowerCase();
  },
};
