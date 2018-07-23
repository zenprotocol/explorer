import TextUtils from './TextUtils';

export default {
  isZP(asset) {
    return asset.asset === '00';
  },
  showAmount(asset) {
    // maybe later change conditions
    return true;
  },
  getAmountString(asset, amount) {
    if (!amount) {
      return '';
    }

    if (this.isZP(asset)) {
      let parsedAmount = String(amount / 100000000);
      if (amount <= 100) {
        parsedAmount = (amount / 100000000).toFixed(8);
      }
      return `${TextUtils.formatNumber(parsedAmount)} ${this.getTypeFromCode(asset.asset)}`;
    }
    return String(TextUtils.formatNumber(amount));
  },
  getTypeFromCode(code) {
    switch (code) {
      case '00':
        return 'ZP';
      default:
        return code;
    }
  },
};
