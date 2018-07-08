module.exports = function (transaction) {
  const assets = {};
  if(transaction.Outputs && transaction.Outputs.length) {
    transaction.Outputs.forEach((output) => {
      if(!assets[output.asset]) {
        assets[output.asset] = {
          inputs: [],
          outputs: [],
        };
      }

      assets[output.asset].outputs.push(output);
    });
  }

  if(transaction.Inputs && transaction.Inputs.length) {
    transaction.Inputs.forEach((input) => {
      if (input.Output) {
        if(!assets[input.Output.asset]) {
          assets[input.Output.asset] = {
            inputs: [],
            outputs: [],
          };
        }
        assets[input.Output.asset].inputs.push(input);
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