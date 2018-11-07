const PREFIXES = ['tzn', 'zen'];

module.exports = {
  addressPrefixes: PREFIXES,
  contractPrefixes: PREFIXES.map(item => `c${item}`),
  getPrefix(chain) {
    return chain !== 'main' ? 'tzn' : 'zen';
  },
  isAddress(address) {
    return this.addressPrefixes.includes(address.substring(0, 3));
  },
  isContract(address) {
    return this.contractPrefixes.includes(address.substring(0, 4));
  },
  isComplete(address) {
    return (this.isAddress(address) || this.isContract(address)) && address.length >= 63;
  },
};