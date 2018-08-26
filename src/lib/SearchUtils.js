export default {
  validateSearchString(searchString) {
    return (
      searchString &&
      searchString.length >= 3 &&
      searchString !== 'zen' &&
      searchString !== 'zen1' &&
      (searchString.indexOf('zen1') !== 0 || searchString.length >= 7)
    );
  },
  isCompleteAddress(searchString) {
    return searchString.indexOf('zen1') == 0 && searchString.length === 63;
  }
};
