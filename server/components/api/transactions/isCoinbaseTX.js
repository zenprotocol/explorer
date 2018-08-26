module.exports = function(transaction) {
  return (
    transaction.Outputs &&
    transaction.Outputs.length &&
    transaction.Outputs[0].lockType.toLowerCase() === 'coinbase'
  );
};
