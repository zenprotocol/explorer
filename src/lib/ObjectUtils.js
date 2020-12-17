export default {
  getSafeProp(object, accessor) {
    if (typeof object !== 'object' || !accessor || typeof accessor !== 'string') {
      return null;
    }

    return accessor
      .split('.')
      .reduce(
        (obj, key) => (obj && typeof obj[key] !== 'undefined' ? obj[key] : undefined),
        object
      );
  },
};
