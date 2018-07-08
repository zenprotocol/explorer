export default {
  isZP(asset) {
    return asset.asset === '00';
  },
  showAmount(asset) {
    // maybe later change conditions
    return true;
  },
  getAmountString(asset, amount) {
    if(!amount) {
      return '';
    }
    return this.isZP(asset)? (amount / 100000000) + ' ZP' : String(amount);
  }
};