const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, 'FixedPayoutDerivative.fst'), 'utf8');

module.exports = {
  name: 'Fixed payout derivative',
  slug: 'fixed-payout-derivative',
  description: '',
  template: data,
};
