'use strict';

const test = require('blue-tape');
const BlocksAdder = require('../BlocksAdder');
const BlockchainParser = require('../../../../server/lib/BlockchainParser');

test('BlocksAdder.getInputsToInsert()', async function (t) {
  await (async function shouldReturnAnEmptyArray() {
    const blocksAdder = new BlocksAdder({}, new BlockchainParser());
    const given = 'Given an empty array';
    const result = blocksAdder.getInputsToInsert({ nodeInputs: [], transactionId: 1 });
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    t.equal(result.length, 0, `${given}: Should return an empty array`);
  })();

  await (async function shouldReturnResults() {
    const blocksAdder = new BlocksAdder({}, new BlockchainParser());
    const given = 'Given an inputs array';
    const result = blocksAdder.getInputsToInsert({
      nodeInputs: [
        {
          mint: {
            asset: '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63',
            amount: 20000000,
          },
        },
        {
          outpoint: {
            txHash: 'fded83cc7e8738028beeb81db7af0406990bd17215cc0f5db37c16904f5e329d',
            index: 31,
          },
        },
      ],
      transactionId: 1,
    });
    t.equal(result.length, 2, `${given}: Should return an array with same length`);
    t.equal(
      ['index', 'isMint', 'asset', 'amount', 'txId', 'blockNumber'].reduce(
        (hasAll, key) => hasAll && Object.keys(result[0]).includes(key)
      ),
      true,
      `${given}: Should contain all of the db keys`
    );

    t.equal(result[0].isMint, true, 'Should be a mint input');
    t.equal(
      ['index', 'outpointTxHash', 'outpointIndex', 'isMint', 'txId', 'blockNumber'].reduce(
        (hasAll, key) => hasAll && Object.keys(result[1]).includes(key)
      ),
      true,
      `${given}: Should contain all of the db keys`
    );
    t.equal(result[1].isMint, false, 'Should not be a mint input');
  })();
});
