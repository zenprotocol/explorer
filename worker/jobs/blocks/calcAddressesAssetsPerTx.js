'use strict';

const { Decimal } = require('decimal.js');

const LOCK_TYPES_FOR_BALANCE = ['Coinbase', 'PK', 'Contract', 'Destroy'];

/**
 * Calculate Address and Asset data per Tx
 * @param {*} params - all params are database entries
 */
function calcAddressAssetsPerTx({ inputs, outputs } = {}) {
  const initAddressAsset = () => ({
    inputSum: new Decimal(0),
    outputSum: new Decimal(0),
  });
  const initAsset = () => ({
    issued: new Decimal(0),
    destroyed: new Decimal(0),
  });
  const addresses = new Map();
  const assets = new Map();

  // go over outputs
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    const address = output.address;
    const asset = output.asset;
    // address
    if (address) {
      if (!addresses.has(address)) {
        addresses.set(address, {});
      }
      if (!addresses.get(address)[asset]) {
        addresses.get(address)[asset] = initAddressAsset();
      }

      // add to outputSum for the asset
      if (LOCK_TYPES_FOR_BALANCE.includes(output.lockType)) {
        const addressObj = addresses.get(address);
        addressObj[asset].outputSum = addressObj[asset].outputSum.plus(output.amount);
      }
    }

    // asset
    if (!assets.has(asset)) {
      assets.set(asset, initAsset());
    }
    if (output.lockType === 'Destroy') {
      const assetObj = assets.get(asset);
      assetObj.destroyed = assetObj.destroyed.plus(output.amount);
    }
  }

  // go over inputs
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const address = input.address;
    const asset = input.asset;
    // address
    if (address && !input.isMint) {
      if (!addresses.has(address)) {
        addresses.set(address, {});
      }
      if (!addresses.get(address)[asset]) {
        addresses.get(address)[asset] = initAddressAsset();
      }

      // add to inputSum for the asset
      if (LOCK_TYPES_FOR_BALANCE.includes(input.lockType)) {
        const addressObj = addresses.get(address);
        addressObj[asset].inputSum = addressObj[asset].inputSum.plus(input.amount);
      }
    }

    // asset
    if (!assets.has(asset)) {
      assets.set(asset, initAsset());
    }
    if (input.isMint) {
      const assetObj = assets.get(asset);
      assetObj.issued = assetObj.issued.plus(input.amount);
    }
  }

  /**
   * take care of change:
   * When a TX has address A in the inputs with amount N1 and address A in the outputs with amount N2, 
   * it means that it sent N1-N2
   */
  addresses.forEach((assets) => {
    const assetIds = Object.keys(assets);
    assetIds.forEach((assetId) => {
      const asset = assets[assetId];
      if (asset.inputSum.gt(0) && asset.outputSum.gt(0)) {
        asset.inputSum = asset.inputSum.minus(asset.outputSum);
        asset.outputSum = new Decimal(0);
      }
    });
  });

  return { addresses, assets };
}

module.exports = calcAddressAssetsPerTx;
