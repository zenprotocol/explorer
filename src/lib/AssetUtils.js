import TextUtils from './TextUtils';

export default {
  isZP(asset) {
    return asset === '00';
  },
  getAmountDivided(asset, amount) {
    return this.isZP(asset) ? Number(amount) / 100000000 : Number(amount);
  },
  getAmountString(asset, amount) {
    if (!amount) {
      return '0';
    }

    amount = Number(amount);
    const amountDivided = this.getAmountDivided(asset, amount);

    if (this.isZP(asset)) {
      const parsedAmount = amount <= 100 ? amountDivided.toFixed(8) : String(amountDivided);
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
