const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;
const ADDRESS_PREFIXES = ['zen', 'tzn'];
const MIN_ADDRESS_SEARCH_LENGTH = 7;

module.exports = {
  NOT_VALID_REGEX,
  isSearchStringValid(searchString) {
    return (
      searchString &&
      (searchString.length >= 3 || (!isNaN(searchString) && Number(searchString) > 0)) &&
      !NOT_VALID_REGEX.test(searchString) &&
      (!ADDRESS_PREFIXES.includes(searchString.substring(0, 3)) ||
        searchString.length >= MIN_ADDRESS_SEARCH_LENGTH) &&
      (!ADDRESS_PREFIXES.map(item => `c${item}`).includes(searchString.substring(0, 4)) ||
        searchString.length >= MIN_ADDRESS_SEARCH_LENGTH + 1)
    );
  },
};
