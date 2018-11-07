const AddressUtils = require('../utils/AddressUtils');
const NOT_VALID_REGEX = /[^a-zA-Z\d.]/g;
const MIN_ADDRESS_SEARCH_LENGTH = 7;

module.exports = {
  NOT_VALID_REGEX,
  isSearchStringValid(search) {
    const searchString = search.toLowerCase().trim();
    return (
      searchString &&
      (searchString.length >= 4 || (!isNaN(searchString) && Number(searchString) > 0)) &&
      !NOT_VALID_REGEX.test(searchString) &&
      (!AddressUtils.addressPrefixes.includes(searchString.substring(0, 3)) ||
        searchString.length >= MIN_ADDRESS_SEARCH_LENGTH)
    );
  },
};
