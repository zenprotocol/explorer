module.exports = function(transaction, address) {
  const assets = transformInputsOutputs(transaction, address);
  const filteredAssets = getFilteredAssetsArray(transaction ,assets, address);
  return filteredAssets.sort((a, b) => b.asset < a.asset);
};

function transformInputsOutputs(transaction, address) {
  const assets = {};
  if (transaction.Inputs && transaction.Inputs.length) {
    const addedInputAddresses = [];
    transaction.Inputs.forEach(input => {
      if (input.Output) {
        if (!assets[input.Output.asset]) {
          assets[input.Output.asset] = getEmptyAsset();
        }
        if (!addedInputAddresses.includes(input.Output.address)) {
          assets[input.Output.asset].inputs.push(input);
          if (input.Output.address) {
            addedInputAddresses.push(input.Output.address);
            if (address && address === input.Output.address) {
              assets[input.Output.asset].addressInInputs = true;
            }
          }
        }
        if (address && address === input.Output.address) {
          assets[input.Output.asset].addressTotal += -1 * Number(input.Output.amount);
        }
      }
    });
  }

  if (transaction.Outputs && transaction.Outputs.length) {
    transaction.Outputs.forEach(output => {
      if (!assets[output.asset]) {
        assets[output.asset] = getEmptyAsset();
      }

      if (address && address === output.address) {
        assets[output.asset].addressInOutputs = true;
        assets[output.asset].addressTotal += Number(output.amount);
      }

      assets[output.asset].total += getOutputAmountForTotal(output, address);

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
  };
}

// TODO - is this right? always? or only when the address was in the inputs?
function getOutputAmountForTotal(output, address) {
  if(!address || address !== output.address) {
    return Number(output.amount);
  }

  return 0;
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
        blockHash: transaction.Block.hash,
        txHash: transaction.hash,
        timestamp: transaction.Block.timestamp,
        Inputs: assets[asset].inputs,
        Outputs: assets[asset].outputs,
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