'use strict';

const test = require('blue-tape');
const BlocksAdder = require('../BlocksAdder');

test('BlocksAdder.getOutputsToInsert()', async function(t) {
  const blocksAdder = new BlocksAdder();

  await (async function shouldReturnAnEmptyArray() {
    const given = 'Given an empty array';
    const result = blocksAdder.getOutputsToInsert({ nodeOutputs: [], transactionId: 1 });
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    t.equal(result.length, 0, `${given}: Should return an empty array`);
  })();

  await (async function shouldReturnResults() {
    const given = 'Given an outputs array';
    const result = blocksAdder.getOutputsToInsert({
      nodeOutputs: [
        {
          lock: {
            PK: {
              hash: '289b193e24445830808aede6c586bf272b6fd2f6c2d81812276cb421ed697d61',
              address: 'zen1q9zd3j03yg3vrpqy2ahnvtp4lyu4kl5hkctvpsy38dj6zrmtf04sswv7ruj',
            },
          },
          spend: {
            asset: '00',
            amount: 50899911,
          },
        },
      ],
      transactionId: 1,
    });
    t.equal(result.length, 1, `${given}: Should return an array with same length`);
    t.deepEqual(
      Object.keys(result[0]),
      [
        'lockType',
        'lockValue',
        'address',
        'contractLockVersion',
        'asset',
        'amount',
        'index',
        'TransactionId',
      ],
      `${given}: Should contain all of the db keys`
    );
  })();
});
