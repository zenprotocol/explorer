import TextUtils from './TextUtils';

export default {
  isZP(asset) {
    return asset === '00';
  },
  showAmount(asset) {
    // maybe later change conditions
    return true;
  },
  getAmountString(asset, amount) {
    if (!amount) {
      return '0';
    }

    amount = Number(amount);

    if (this.isZP(asset)) {
      let parsedAmount = String(amount / 100000000);
      if (amount <= 100) {
        parsedAmount = (amount / 100000000).toFixed(8);
      }
      return `${TextUtils.formatNumber(parsedAmount)} ${this.getAssetNameFromCode(asset)}`;
    }
    return String(TextUtils.formatNumber(amount));
  },
  getAssetNameFromCode(code) {
    let name = code;
    if (code === '00') {
      name = 'ZP';
    }

    return this.removeLeadingAndTrailingZeros(name);
  },
  removeLeadingAndTrailingZeros(asset) {
    if(typeof asset !== 'string') {
      return '';
    }
    return asset.length > 8 ? asset.replace(/^0+/, '').replace(/0+$/, '') : asset;
  },
};
