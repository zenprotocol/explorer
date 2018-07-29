module.exports = function(transaction, address) {
  const assets = {};
  if (transaction.Inputs && transaction.Inputs.length) {
    const addedInputAddresses = [];
    transaction.Inputs.forEach(input => {
      if (input.Output) {
        if (!assets[input.Output.asset]) {
          assets[input.Output.asset] = {
            inputs: [],
            outputs: [],
          };
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
      }
    });
  }

  if (transaction.Outputs && transaction.Outputs.length) {
    transaction.Outputs.forEach(output => {
      if (canAddAddressToOutputs(address, assets, output)) {
        if (!assets[output.asset]) {
          assets[output.asset] = {
            inputs: [],
            outputs: [],
          };
        }

        if (address && output.address && address === output.address) {
          assets[output.asset].addressInOutputs = true;
        }

        setActivationSacrificeAsset(assets[output.asset], output);

        assets[output.asset].outputs.push(output);
      }
    });
  }

  const filteredAssets = getFilteredAssetsArray(assets, address);
  
  return filteredAssets.sort((a, b) => b.asset < a.asset);
};

function canAddAddressToOutputs(address, assets, output) {
  if (addressInOutputsOnlyAndNotEqualToGivenAddress(address, assets, output) || isAddressInActivationSacrificeTX(assets, output)) {
    return false;
  }
  return true;
}

function addressInOutputsOnlyAndNotEqualToGivenAddress(address, assets, output) {
  return address && output.address && (!assets[output.asset] || !assets[output.asset].addressInInputs) && address !== output.address;
}

function getFilteredAssetsArray(assets, address) {
  return Object.keys(assets).reduce((all, asset) => {
    const addressFoundIn = getAddressFoundInArray(assets, asset);

    if (!address || addressFoundIn.length || isActivationSacrificeAsset(assets[asset])) {
      all.push({
        asset,
        addressFoundIn,
        inputs: assets[asset].inputs,
        outputs: assets[asset].outputs,
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

function setActivationSacrificeAsset(asset, output) {
  if(output.lockType === 'ActivationSacrifice') {
    asset.isActivationSacrifice = true;
  }
}
function isActivationSacrificeAsset(asset) {
  return asset.isActivationSacrifice === true;
}
function isAddressInActivationSacrificeTX(assets, output) {
  const asset = assets[output.asset];
  return asset && isActivationSacrificeAsset(asset) && output.address !== null;
}