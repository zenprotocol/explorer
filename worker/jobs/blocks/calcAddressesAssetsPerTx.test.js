'use strict';

/**
 * For testing purposes, a normal (equal between db and node) hash will be the blockNumber, a different hash is 'abc'
 */

const test = require('tape');
const calcAddressesAssetsPerTx = require('./calcAddressesAssetsPerTx');

test('BlocksAdder -> calcAddressesAssetsPerTx()', function (t) {
  wrapTest('Given each address has either an input or an output', async (given) => {
    const { addresses } = calcAddressesAssetsPerTx({
      inputs: [{ lockType: 'PK', address: 'address1', asset: 'asset1', amount: '1' }],
      outputs: [{ lockType: 'PK', address: 'address2', asset: 'asset2', amount: '2' }],
    });
    t.assert(
      addresses.size === 2 &&
        addresses.get('address1').asset1.inputSum.eq('1') &&
        addresses.get('address1').asset1.outputSum.eq('0') &&
        addresses.get('address2').asset2.inputSum.eq('0') &&
        addresses.get('address2').asset2.outputSum.eq('2'),
      `${given}: Should have the amounts unchanged per address`
    );
  });
  wrapTest('Given address has both inputs and outputs for same asset', async (given) => {
    const { addresses } = calcAddressesAssetsPerTx({
      inputs: [{ lockType: 'PK', address: 'address1', asset: 'asset1', amount: '5' }],
      outputs: [{ lockType: 'PK', address: 'address1', asset: 'asset1', amount: '2' }],
    });
    t.assert(
        addresses.get('address1').asset1.inputSum.eq('3') &&
        addresses.get('address1').asset1.outputSum.eq('0')
        ,
      `${given}: Should treat the output for same address as change`
    );
  });

  t.end();
});

// HELPERS
function wrapTest(given, test) {
  test(given);
}
