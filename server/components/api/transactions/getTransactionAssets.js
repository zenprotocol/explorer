module.exports = function (transaction, address) {
  const assets = {};
  let addressInInputs = false;
  if(transaction.Inputs && transaction.Inputs.length) {
    const addedInputAddresses = [];
    transaction.Inputs.forEach((input) => {
      if (input.Output) {
        if(!assets[input.Output.asset]) {
          assets[input.Output.asset] = {
            inputs: [],
            outputs: [],
          };
        }
        if (!addedInputAddresses.includes(input.Output.address)) {
          addedInputAddresses.push(input.Output.address);
          assets[input.Output.asset].inputs.push(input);
          if (address === input.Output.address) {
            addressInInputs = true;
          }
        }
      }
    });
  }

  if(transaction.Outputs && transaction.Outputs.length) {
    transaction.Outputs.forEach((output) => {
      if(canAddAddressToOutputs(address, addressInInputs, output)) {
        if(!assets[output.asset]) {
          assets[output.asset] = {
            inputs: [],
            outputs: [],
          };
        }
  
        assets[output.asset].outputs.push(output);
      }
    });
  }

  return Object.keys(assets).map((asset) => {
    return {
      asset: asset,
      inputs: assets[asset].inputs,
      outputs: assets[asset].outputs,
    };
  }).sort((a, b) => b.asset < a.asset);
}

function canAddAddressToOutputs(address, addressInInputs, output) {
  if(address && !addressInInputs && output.address && address !== output.address) {
    return false;
  }
  return true;
}