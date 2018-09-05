const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;

export default {
  validateSearchString(searchString) {
    return (
      searchString &&
      searchString.length >= 3 &&
      !NOT_VALID_REGEX.test(searchString) &&
      searchString !== 'zen' &&
      searchString !== 'zen1' &&
      (searchString.indexOf('zen1') !== 0 || searchString.length >= 7)
    );
  },
  isCompleteAddress(searchString) {
    return searchString.indexOf('zen1') === 0 && searchString.length === 63;
  },
  formatSearchString(searchString) {
    return String(searchString).replace(NOT_VALID_REGEX, '').toLowerCase();
  },
};
