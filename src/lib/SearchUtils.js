const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;
const ADDRESS_PREFIXES = ['zen', 'tzn'];
const MIN_ADDRESS_SEARCH_LENGTH = 7;

export default {
  validateSearchString(searchString) {
    return (
      searchString &&
      searchString.length >= 3 &&
      !NOT_VALID_REGEX.test(searchString) &&
      (!ADDRESS_PREFIXES.includes(searchString.substring(0, 3)) ||
        searchString.length >= MIN_ADDRESS_SEARCH_LENGTH) &&
      (!ADDRESS_PREFIXES.map(item => `c${item}`).includes(searchString.substring(0, 4)) ||
        searchString.length >= MIN_ADDRESS_SEARCH_LENGTH + 1)
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
