export default {
  validateSearchString(searchString) {
    return (
      searchString && searchString.length >= 3 && searchString !== 'zen' && searchString !== 'zen1'
    );
  },
};
