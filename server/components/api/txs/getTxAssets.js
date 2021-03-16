const { Decimal } = require('decimal.js');
const getAssetName = require('../../../lib/getAssetName');
/**
 * Get an array with each asset in the tx, each containing inputs and outputs arrays
 */
module.exports = function (tx, address) {
  const assets = groupInputsOutputsByAsset(tx, address);
  const filteredAssets = getFilteredAssetsArray(tx, assets, address);
  return filteredAssets.sort((a, b) => b.asset < a.asset);
};

function groupInputsOutputsByAsset(tx, address) {
  const assets = {};
  if (tx.inputs && tx.inputs.length) {
    const addedInputAddresses = [];
    tx.inputs.forEach((input) => {
      if (!assets[input.asset]) {
        assets[input.asset] = getEmptyAsset();
      }
      assets[input.asset].metadata = getAssetName(input.asset);
      if (!addedInputAddresses.includes(input.address)) {
        assets[input.asset].inputs.push(input);
        if (input.address) {
          addedInputAddresses.push(input.address);
          if (address && address === input.address) {
            assets[input.asset].addressInInputs = true;
          }
        }
      }
      if (address && address === input.address) {
        assets[input.asset].addressTotal = new Decimal(assets[input.asset].addressTotal)
          .minus(input.amount)
          .toString();
      }
    });
  }

  if (tx.outputs && tx.outputs.length) {
    tx.outputs.forEach((output) => {
      if (!assets[output.asset]) {
        assets[output.asset] = getEmptyAsset();
      }

      if (address && address === output.address) {
        assets[output.asset].addressInOutputs = true;
        assets[output.asset].addressTotal = new Decimal(assets[output.asset].addressTotal)
          .plus(output.amount)
          .toString();
      }

      assets[output.asset].total = new Decimal(assets[output.asset].total)
        .plus(getOutputAmountForTotal(output, address))
        .toString();

      assets[output.asset].outputs.push(output);
    });
  }
  return assets;
}

function getEmptyAsset() {
  return {
    total: 0,
    addressTotal: 0,
    inputs: [],
    outputs: [],
    metadata: '',
  };
}

// TODO: - is this right? always? or only when the address was in the inputs?
function getOutputAmountForTotal(output, address) {
  if (!address || address !== output.address) {
    return output.amount;
  }

  return '0';
}

function getFilteredAssetsArray(transaction, assets, address) {
  return Object.keys(assets).reduce((all, asset) => {
    const addressFoundIn = getAddressFoundInArray(assets, asset);

    if (!address || addressFoundIn.length) {
      all.push({
        asset,
        addressFoundIn,
        total: assets[asset].total,
        addressTotal: assets[asset].addressTotal,
        inputs: assets[asset].inputs,
        outputs: assets[asset].outputs,
        metadata: assets[asset].metadata || ''
      });
    }

    return all;
  }, []);
}

function getAddressFoundInArray(assets, asset) {
  const addressFoundIn = [];
  if (assets[asset].addressInInputs) addressFoundIn.push('input');
  if (assets[asset].addressInOutputs) addressFoundIn.push('output');
  return addressFoundIn;
}
