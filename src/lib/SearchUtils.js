import {
  isSearchStringValid as validateSearchString,
  NOT_VALID_REGEX,
} from '../common/validations/search';

export default {
  validateSearchString,
  formatSearchString(searchString) {
    return String(searchString)
      .replace(NOT_VALID_REGEX, '')
      .toLowerCase();
  },
};
