'use strict';

const { Decimal } = require('decimal.js');
const test = require('tape');
const getTxAssets = require('./getTxAssets');

test('getTransactionAssets ----------------------------------------------------------------------', function(t) {t.end();});

test('Test assets array length', function(t) {
  const assets = getTxAssets(testTxInsOuts);
  t.equals(assets.length, 2, 'There should be 2 assets');
  t.end();
});
test('Test assets array length - address with asset 00', function(t) {
  const assets = getTxAssets(testTxInsOuts, testAddressInOutput);
  t.equals(assets.length, 1, 'Only the asset that this address is in should appear');
  t.end();
});

test('Test assets order', function(t) {
  const assets = getTxAssets(testTxInsOuts);
  t.equals(assets[0].asset, '00', 'The assets array should be ordered');
  t.end();
});
test('Test input output lengths', function(t) {
  const assets = getTxAssets(testTxInsOuts);
  t.equals(
    assets[0].inputs.length,
    testTxInsOuts.inputs.length - 1,
    'All the source inputs belong to asset 00 and should be unique'
  );
  t.equals(
    assets[0].outputs.length,
    testTxInsOuts.outputs.length - 2,
    'All outputs but 2 should be in the asset 00'
  );
  t.equals(assets[1].inputs.length, 0, 'There are no inputs for asset 01');
  t.equals(assets[1].outputs.length, 2, 'There are 2 outputs for asset 01');
  t.end();
});

test('Test input output lengths with address supplied', function(t) {
  const assets = getTxAssets(testTxInsOuts, testAddressInInputAndOutput);
  t.equals(
    assets[0].inputs.length,
    testTxInsOuts.inputs.length - 1,
    'All the source inputs belong to asset 00 and should be unique'
  );
  t.equals(
    assets[0].outputs.length,
    testTxInsOuts.outputs.length - 2,
    'All outputs but 2 should be in the asset 00'
  );
  t.end();
});

test('Test addressFoundIn attribute with no address supplied', function(t) {
  const assets = getTxAssets(testTxInsOuts);
  t.deepEquals(assets[0].addressFoundIn, [], 'addressFoundIn array should be empty');
  t.end();
});

test('Test addressFoundIn attribute for address in input', function(t) {
  const assets = getTxAssets(testTxInsOuts, testAddressInInput);
  t.deepEquals(assets[0].addressFoundIn, ['input'], 'addressFoundIn array should have "inputs" for asset 0');
  t.end();
});

test('Test addressFoundIn attribute for address in output', function(t) {
  const assets = getTxAssets(testTxInsOuts, testAddressInOutput);
  t.deepEquals(
    assets[0].addressFoundIn,
    ['output'],
    'addressFoundIn array should have "outputs" for asset 0'
  );
  t.end();
});

test('Test addressFoundIn attribute for address in input and output', function(t) {
  const assets = getTxAssets(testTxInsOuts, testAddressInInputAndOutput);
  t.deepEquals(
    assets[0].addressFoundIn,
    ['input', 'output'],
    'addressFoundIn array should have "inputs" and "outputs" for asset 0'
  );
  t.end();
});

test('Test total - no address supplied', function(t) {
  const assets = getTxAssets(testTxInsOuts);
  const total0 = testTxInsOuts.outputs.reduce((total, cur) => {
    if (cur.asset == '00') {
      total = new Decimal(total).plus(cur.amount).toString();
    }

    return total;
  }, '0');

  t.equals(assets[0].total, total0, 'Total should be the addition of all outputs with asset 00');
  t.end();
});

test('Test total - with address', function(t) {
  const address = testAddressInOutput;
  const assets = getTxAssets(testTxInsOuts, address);
  const total0 = testTxInsOuts.outputs.reduce((total, cur) => {
    if (cur.asset == '00' && cur.address !== address) {
      total = new Decimal(total).plus(cur.amount).toString();
    }

    return total;
  }, '0');

  t.equals(
    assets[0].total,
    total0,
    'Total should be the addition of all outputs with asset 00 except of the supplied address'
  );
  t.end();
});

test('Test addressTotal - address in inputs only', function(t) {
  const address = testAddressInInput;
  const assets = getTxAssets(testTxInsOuts, address);
  const totalInputs = testTxInsOuts.inputs.reduce((total, cur) => {
    if (cur.asset === '00' && cur.address === address) {
      total = new Decimal(total).minus(cur.amount).toString();
    }
    return total;
  }, '0');

  t.equals(assets[0].addressTotal, totalInputs, 'Total should be -1 * total in inputs');
  t.end();
});

test('Test addressTotal - address in outputs only', function(t) {
  const address = testAddressInOutput;
  const assets = getTxAssets(testTxInsOuts, address);
  const totalInputs = testTxInsOuts.inputs.reduce((total, cur) => {
    if (cur.asset === '00' && cur.address === address) {
      total = new Decimal(total).plus(cur.amount).toString();
    }
    return total;
  }, '0');
  const totalOutputs = testTxInsOuts.outputs.reduce((total, cur) => {
    if (cur.asset === '00' && cur.address === address) {
      total = new Decimal(total).plus(cur.amount).toString();
    }
    return total;
  }, '0');

  t.equals(
    assets[0].addressTotal,
    new Decimal(totalOutputs).minus(totalInputs).toString(),
    'Total should be the addition of all output amounts for the address'
  );
  t.end();
});

test('Test addressTotal - address in inputs and outputs', function(t) {
  const address = testAddressInInputAndOutput;
  const assets = getTxAssets(testTxInsOuts, address);
  const totalInputs = testTxInsOuts.inputs.reduce((total, cur) => {
    if (cur.asset === '00' && cur.address === address) {
      total = new Decimal(total).plus(cur.amount).toString();
    }
    return total;
  }, '0');
  const totalOutputs = testTxInsOuts.outputs.reduce((total, cur) => {
    if (cur.asset === '00' && cur.address === address) {
      total = new Decimal(total).plus(cur.amount).toString();
    }
    return total;
  }, '0');

  t.equals(
    assets[0].addressTotal,
    new Decimal(totalOutputs).minus(totalInputs).toString(),
    'Total should be the addition of all output minus the inputs'
  );
  t.end();
});

const testAddressInOutput = 'zen1q55eslzak4z0wcu76hela53kg7rl9fyej38ykzlssp2h9c5wvgtwq50vtzv';
const testAddressInInput = 'zen1q03jc77dtd2x2gk90f40p9ezv5pf3e2wm5hy8me2xuxzmjneachrq6g05w5';
const testAddressInInputAndOutput = 'zen1qkr6aunrpjccdpltncey392ajppf5955ghxut30r3xlcnlg83d7dq96ke7l';

/**
 * This transaction was changed for the test:
 * 1. changed 2 outputs' assets from '00' to '01' for testing purposes
 * 2. one of the outputs with asset '01' has null for the address!
 * 3. for address 'testAddressInOutput', added another output with this address
 * 4. for address 'testAddressInInput', added another input
 */
const testTxInsOuts = {
  outputs: [
    {
      id: '123819',
      lockType: 'PK',
      contractLockVersion: 0,
      address: 'zen1qx9p4x2wud5e7p8n5rah2flh7yjpmpns8zeyp7hwejxc06vzlwt2sammty0',
      lockValue: '31435329dc6d33e09e741f6ea4fefe2483b0ce0716481f5dd991b0fd305f72d5',
      asset: '00',
      amount: '100467498',
      index: 0,
      txId: '7399',
      blockNumber: 4717,
    },
    {
      id: '123820',
      lockType: 'PK',
      contractLockVersion: 0,
      address: 'zen1q2cdacq90636uksaqphnn4pzu0y7093y735cjkvc7w27wpu9fdpzq5x8d3q',
      lockValue: '561bdc00afd475cb43a00de73a845c793cf2c49e8d312b331e72bce0f0a96844',
      asset: '01', // FAKE
      amount: '16365200',
      index: 1,
      txId: '7399',
      blockNumber: 4717,
    },
    {
      id: '123821',
      lockType: 'PK',
      contractLockVersion: 0,
      address: null,
      lockValue: '7b640f8c0679cec719ffb2cc287bc84f91ca55f685cbdb05d33419123528a100',
      asset: '01', // FAKE
      amount: '159493209',
      index: 2,
      txId: '7399',
      blockNumber: 4717,
    },
    {
      id: '123954',
      lockType: 'PK',
      contractLockVersion: 0,
      address: testAddressInInputAndOutput,
      lockValue: 'b0f5de4c619630d0fd73c64912abb2085342d288b9b8b8bc7137f13fa0f16f9a',
      asset: '00',
      amount: '1104967618',
      index: 135,
      txId: '7399',
      blockNumber: 4717,
    },
    {
      // FAKE - ADDED FOR TEST
      id: '12383645',
      lockType: 'PK',
      contractLockVersion: 0,
      address: testAddressInOutput,
      lockValue: 'a5330f8bb6a89eec73dabe7fda46c8f0fe54933289c9617e100aae5c51cc42dc',
      asset: '00',
      amount: '10000000',
      index: 136,
      txId: '7399',
      blockNumber: 4717,
    },
  ],
  inputs: [
    {
      id: '56064',
      index: 0,
      outpointTxHash: '47b54fc43ee9a74df85ef65dd591c6937582a601101515c0da2f4f016f1dcec7',
      outpointIndex: 0,
      txId: '7399',
      blockNumber: 4717,
      outputId: '110764',
      lockType: 'Coinbase',
      address: testAddressInInput,
      asset: '00',
      amount: '5000003847',
    },
    {
      id: '56065',
      index: 1,
      outpointTxHash: '5918a0f9d223b17c0134400314eb661969c2de047a2065bc45ad4ba7fb37f8e0',
      outpointIndex: 138,
      txId: '7399',
      blockNumber: 4717,
      outputId: '123814',
      lockType: 'PK',
      address: testAddressInInputAndOutput,
      asset: '00',
      amount: '1060217261',
    },
    {
      id: '5606445',
      index: 2,
      outpointTxHash: '47b54fc43ee9a74df85ef65dd591c6937582a601101515c0da2f4f016f1dcec7',
      outpointIndex: 0,
      txId: '7399',
      blockNumber: 4717,
      outputId: '110764',
      lockType: 'Coinbase',
      address: testAddressInInput,
      asset: '00',
      amount: '5000003847',
    },
  ],
};
