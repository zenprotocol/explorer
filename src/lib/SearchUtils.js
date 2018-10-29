import {isSearchStringValid as validateSearchString, NOT_VALID_REGEX} from '../common/validations/search';

export default {
  validateSearchString,
  isCompleteAddress(searchString) {
    return searchString.indexOf('zen1') === 0 && searchString.length === 63;
  },
  formatSearchString(searchString) {
    return String(searchString)
      .replace(NOT_VALID_REGEX, '')
      .toLowerCase();
  },
};
