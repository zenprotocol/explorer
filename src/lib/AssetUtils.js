import Decimal from 'decimal.js';
import TextUtils from './TextUtils';

export default {
  isZP(asset) {
    return asset === '00';
  },
  getAmountDivided(amount) {
    if (!amount) {
      return '0';
    }

    const amountDivided = new Decimal(amount).div(100000000);
    const parsedAmount = amountDivided.toFixed(Math.min(8, amountDivided.decimalPlaces()));
    return TextUtils.formatNumber(parsedAmount);
  },
  getAssetNameFromCode(code) {
    let name = code;
    if (code === '00') {
      name = 'ZP';
    }

    return name;
  },
};
