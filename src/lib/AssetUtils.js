import Decimal from 'decimal.js';
import TextUtils from './TextUtils';

export default {
  isZP(asset) {
    return asset === '00';
  },
  getAmountDivided(asset, amount) {
    return this.isZP(asset)
      ? new Decimal(amount).div(100000000).toNumber()
      : new Decimal(amount).toNumber();
  },
  getAmountString(asset, amount) {
    if (!amount) {
      return '0';
    }

    const amountDivided = new Decimal(this.getAmountDivided(asset, amount));

    if (this.isZP(asset)) {
      const parsedAmount = amountDivided.toFixed(Math.min(8, amountDivided.decimalPlaces()));
      return `${TextUtils.formatNumber(parsedAmount)} ${this.getAssetNameFromCode(asset)}`;
    }
    return String(TextUtils.formatNumber(amount));
  },
  getAssetNameFromCode(code) {
    let name = code;
    if (code === '00') {
      name = 'ZP';
    }

    return name;
  },
};
