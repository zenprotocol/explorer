'use strict';

const test = require('blue-tape');
const td = require('testdouble');

const BLOCK1_HASH = 'cb746bfdbc472602064dbc04e66326a8edf11a3c64d08ddfa90257e86e866b0f';

let blocksDAL;
let blocksAdder;

test('BlocksAdder.isReorg()', async function(t) {
  await wrapTest('Check return type', async given => {
    const result = await blocksAdder.isReorg({nodeBlock: getNodeBlock()});
    t.assert(typeof result === 'boolean', 'Should return a Boolean');
  });

  await wrapTest('Given block 1', async given => {
    const result = await blocksAdder.isReorg({nodeBlock: getNodeBlock()});
    t.equal(result, false, `${given}: Should return false`);
  });

  await wrapTest('Given block with parent equals to db prev hash', async given => {
    td.when(blocksDAL.findById(1, td.matchers.anything())).thenResolve({hash: BLOCK1_HASH});
    const result = await blocksAdder.isReorg({nodeBlock: getNodeBlock({blockNumber: 2, parent: BLOCK1_HASH})});
    t.equal(result, false, `${given}: Should return false`);
  });

  await wrapTest('Given block with parent not equals to db prev hash', async given => {
    td.when(blocksDAL.findById(1, td.matchers.anything())).thenResolve({hash: BLOCK1_HASH});
    const result = await blocksAdder.isReorg({nodeBlock: getNodeBlock({blockNumber: 2, parent: 'whatever'})});
    t.equal(result, true, `${given}: Should return true`);
  });
});

// HELPERS
async function wrapTest(given, test) {
  blocksDAL = td.replace('../../../../server/components/api/blocks/blocksDAL', {
    findById: td.func('findById'),
  });
  td.replace('../../../../server/components/api/transactions/txsDAL', {});
  td.replace('../../../../server/components/api/outputs/outputsDAL', {});
  td.replace('../../../../server/components/api/inputs/inputsDAL', {});
  td.replace('../../../../server/components/api/infos/infosDAL', {});
  const BlocksAdder = require('../BlocksAdder');
  blocksAdder = new BlocksAdder();

  await test(given);

  td.reset();
}

function getNodeBlock({blockNumber = 1, parent = ''} = {}) {
  return {
    blockNumber,
    reward: 50000000,
    item: {
      header: {
        blockNumber,
        parent,
      }
    }
  };
}