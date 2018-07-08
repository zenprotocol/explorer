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

    if(this.isZP(asset)) {
      let parsedAmount = String(amount / 100000000);
      if (amount <= 100) {
        parsedAmount = (amount / 100000000).toFixed(8);
      }
      return `${parsedAmount} ZP`;
    }
    return String(amount);
  }
};