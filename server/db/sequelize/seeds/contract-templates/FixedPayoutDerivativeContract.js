const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, 'FixedPayoutDerivativeContract.fst'), 'utf8');

module.exports = {
  name: 'Fixed payout derivative contract',
  description: '',
  template: data,
};
