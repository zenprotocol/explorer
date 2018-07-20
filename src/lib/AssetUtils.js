const ZEN_ASSET_HASH = '00'
const ZEN_ASSET_NAME = 'ZP'
export default {
  isZP(asset) {
    return asset.asset === ZEN_ASSET_HASH;
  },
  showAmount(asset) {
    // maybe later change conditions
    return true;
  },
  getAmountString(asset, amount) {
    if (!amount) {
      return '';
    }
    if (!this.isZP(asset)) {
      return String(amount);
    }

    const parsedAmount = amount <= 100
      ? String(amount / 100000000);
      : (amount / 100000000).toFixed(8);
    return `${parsedAmount} ${this.assetHash(asset)}`;
  },
  assetHash(asset) {
    return this.isZP(asset) ? ZEN_ASSET_NAME : asset.asset
  },
};
