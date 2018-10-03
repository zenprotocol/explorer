'use strict';

const test = require('tape');
const BlockchainParser = require('./BlockchainParser');

test('getLockValuesFromOutput - no lock value', function(t) {
  const blockchainParser = new BlockchainParser();
  const output = {
    lock: {
      PK: {
        whatever: '7c658f79ab6a8ca458af4d5e12e44ca0531ca9dba5c87de546e185b94f3dc5c6',
      },
    },
    spend: {
      asset: '00',
      amount: 5000001794,
    },
  };
  const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
  t.equals(lockType, 'PK', 'lock type should be PK');
  t.equals(lockValue, null, 'lock value should be null');
  t.equals(address, null, 'address should be null');
  t.end();
});

test('getLockValuesFromOutput - coinbase', function(t) {
  const blockchainParser = new BlockchainParser();
  const output = {
    lock: {
      Coinbase: {
        blockNumber: 30419,
        pkHash: '7c658f79ab6a8ca458af4d5e12e44ca0531ca9dba5c87de546e185b94f3dc5c6',
      },
    },
    spend: {
      asset: '00',
      amount: 5000001794,
    },
  };
  const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
  t.equals(lockType, 'Coinbase', 'lock type should be coinbase');
  t.equals(
    lockValue,
    '7c658f79ab6a8ca458af4d5e12e44ca0531ca9dba5c87de546e185b94f3dc5c6',
    'lock value should be pkHash'
  );
  t.assert(address.startsWith('zen1'), 'address should start with zen1');
  t.end();
});

test('getLockValuesFromOutput - PK', function(t) {
  const blockchainParser = new BlockchainParser();
  const output = {
    lock: {
      PK: {
        hash: '874311d86cfeb164c9f380966eff09b9510e09749b708b96607c566291066c19',
        address: 'zen1qsap3rkrvl6ckfj0nsztxalcfh9gsuzt5ndcgh9nq03tx9ygxdsvshgeter',
      },
    },
    spend: {
      asset: '00',
      amount: 31282056,
    },
  };
  const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
  t.equals(lockType, 'PK', 'lock type should be PK');
  t.equals(
    lockValue,
    '874311d86cfeb164c9f380966eff09b9510e09749b708b96607c566291066c19',
    'lock value should be pkHash'
  );
  t.equals(
    address,
    'zen1qsap3rkrvl6ckfj0nsztxalcfh9gsuzt5ndcgh9nq03tx9ygxdsvshgeter',
    'address should be pkHash'
  );
  t.end();
});

test('getLockValuesFromOutput - Contract', function(t) {
  const blockchainParser = new BlockchainParser();
  const output = {
    lock: {
      Contract: {
        id: '000000005b8fbf5f70a8d7b46f2601794d2b16f1d9c009de526a80ffc44266b4c9fddc7e',
        address: 'czen1qqqqqqqzm37l47u9g676x7fsp09xjk9h3m8qqnhjjd2q0l3zzv66vnlwu0cr3z2yd',
      },
    },
    spend: {
      asset: '00',
      amount: 40000000,
    },
  };
  const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
  t.equals(lockType, 'Contract', 'lock type should be Contract');
  t.equals(
    lockValue,
    '000000005b8fbf5f70a8d7b46f2601794d2b16f1d9c009de526a80ffc44266b4c9fddc7e',
    'lock value should be the id'
  );
  t.equals(
    address,
    'czen1qqqqqqqzm37l47u9g676x7fsp09xjk9h3m8qqnhjjd2q0l3zzv66vnlwu0cr3z2yd',
    'address should start with czen1'
  );
  t.end();
});
