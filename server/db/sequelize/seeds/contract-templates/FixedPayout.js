const fs = require('fs');
const path = require('path');

const data = fs.readFileSync(path.join(__dirname, 'FixedPayout.fst'), 'utf8');

module.exports = {
  name: 'Fixed payout contract',
  slug: 'fixed-payout',
  description: '<p>The fixed payout contract, is a simple contract which includes a number of terms and an oracle to provide the information of the outcome which the final payout will be made based upon.</p><p>For every ZP sent to the contact, the contract issues a bull and a bear token, and once the terms of the contract come to maturity, one may redeem the ZP in collateral using the winning token (bull or bear) and by providing sufficient proof from the oracle on the final outcome.</p>',
  template: data,
};
