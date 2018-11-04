const PREFIXES = ['tzn', 'zen'];

export default {
  isAddress(address) {
    return PREFIXES.includes(address.substring(0, 3));
  },
  isContract(address) {
    return PREFIXES.map(item => `c${item}`).includes(address.substring(0, 4));
  },
};