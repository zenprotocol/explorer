'use strict';

const test = require('blue-tape');
const Service = require('../../../../server/lib/Service');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const txsDAL = require('../../../../server/components/api/txs/txsDAL');
const inputsDAL = require('../../../../server/components/api/inputs/inputsDAL');
const addressTxsDAL = require('../../../../server/components/api/address-txs/addressTxsDAL');
const addressesDAL = require('../../../../server/components/api/addresses/addressesDAL');
const assetTxsDAL = require('../../../../server/components/api/asset-txs/assetTxsDAL');
const assetsDAL = require('../../../../server/components/api/assets/assetsDAL');
const contractsDAL = require('../../../../server/components/api/contracts/contractsDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlockchainParser = require('../../../../server/lib/BlockchainParser');
const mock = require('./mock');
const BlocksAdder = require('../BlocksAdder');
const Config = require('../../../../server/config/Config');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

test('BlocksAdder.doJob()', async function (t) {
  await wrapTest('Given nothing in db', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      const { count, latest } = await blocksAdder.doJob({
        data: { limitBlocks: 2, skipTransactions: true },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);
      t.equal(latest, 2, `${given}: Should return the latest block added`);

      const block1 = await blocksDAL.findById(1);
      t.assert(block1 !== null, `${given}: Block 1 should be in the db`);
      t.equal(
        block1.reward,
        '2000000000000000',
        `${given}: Block 1 should have the genesis reward`
      );

      const block2 = await blocksDAL.findById(2);
      t.assert(block2 !== null, `${given}: Block 2 should be in the db`);
      t.equal(block2.reward, '5000000000', `${given}: Block 2 should have a reward`);
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });

  await wrapTest('Given some already in DB', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    // add demo first block in DB
    await blocksDAL.create({
      version: 0,
      hash: 'cb746bfdbc472602064dbc04e66326a8edf11a3c64d08ddfa90257e86e866b0f',
      parent: '0000000000000000000000000000000000000000000000000000000000000000',
      blockNumber: 1,
      commitments: 'test commitments',
      timestamp: 123456789,
      difficulty: 486539008,
      nonce1: -8412464686019857620,
      nonce2: 25078183,
    });

    try {
      const { count, latest } = await blocksAdder.doJob({
        data: { limitBlocks: 1, skipTransactions: true },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);
      t.equal(latest, 2, `${given}: Should return the latest block added`);

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.equals(latestBlockAfterAdd.blockNumber, 2, `${given}: The latest block number should be 2`);
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given network error when getting blocks info from node', async (given) => {
    const networkHelper = new NetworkHelper();
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    // mute the service to get empty responses
    Service.config.setBaseUrl('http://wrong.address.io');
    Service.config.setTimeout(1);

    try {
      await blocksAdder.doJob({ data: { limitBlocks: 1 } });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      t.pass(`${given}: Should throw an error`);
    }

    Service.config.setBaseUrl(Config.get('zp:node'));
    Service.config.setTimeout(0);
  });
  await wrapTest('Given new blocks with transactions', async (given) => {
    const ADDRESS_IN_BLOCK_1 = 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf';
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      const { count } = await blocksAdder.doJob({
        data: { limitBlocks: 2, limitTransactions: 2 },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlockAfterAdd !== null, `${given}: There should be new blocks in the db`);
      const txs = await txsDAL.findAll({
        where: {
          blockNumber: latestBlockAfterAdd.blockNumber,
        },
      });
      t.assert(txs.length > 0, `${given}: There should be transactions for this block`);
      t.assert(txs[0].blockNumber > 0, `${given}: A tx should contain the blockNumber`);

      // check extra fields in block
      t.assert(latestBlockAfterAdd.reward > 0, `${given}: block 2 should have a positive reward`);
      t.assert(
        latestBlockAfterAdd.coinbaseAmount > 0,
        `${given}: block 2 should have a positive coinbaseAmount`
      );
      t.assert(
        latestBlockAfterAdd.allocationAmount === '0',
        `${given}: block 2 should have allocationAmount = 0`
      );

      // check Addresses, Assets, AddressTxs, AssetTxs
      const addresses = await addressesDAL.findAll();
      t.assert(addresses.length > 0, `${given}: There should be rows in the Addresses table`);
      const address = addresses.find((a) => a.address === ADDRESS_IN_BLOCK_1);
      t.assert(
        address !== null,
        `${given}: an specific address from block 1 should exist in Addresses`
      );
      t.equal(address.asset, '00', `${given}: The address should have asset 00`);
      t.equal(address.inputSum, '0', `${given}: The address should have inputSum = 0`);
      t.equal(
        address.outputSum,
        '100000000000',
        `${given}: The address should have outputSum 100000000000`
      );
      t.equal(
        address.balance,
        '100000000000',
        `${given}: The address should have balance 100000000000`
      );
      t.equal(address.txsCount, '1', `${given}: The address should have txsCount 1`);
      const addressTxs = await addressTxsDAL.findAll();
      t.assert(addressTxs.length > 0, `${given}: There should be rows in the AddressTxs table`);
      t.equal(
        addressTxs.some((a) => a.address === ADDRESS_IN_BLOCK_1),
        true,
        `${given}: an specific address from block 1 should exist in AddressTxs`
      );
      const assets = await assetsDAL.findAll();
      t.equal(assets.length, 1, `${given}: There should be 1 row in the Assets table for 00`);
      t.equal(assets[0].asset, '00', `${given}: The only asset in Assets should be 00`);
      t.equal(
        assets[0].issued,
        '2000005000000000',
        `${given}: should have issued 50 ZP + GENESIS (2 blocks)`
      );
      t.equal(assets[0].destroyed, '0', `${given}: should have destroyed 0 ZP`);
      t.equal(
        assets[0].outstanding,
        '2000005000000000',
        `${given}: should have outstanding 50 ZP + GENESIS`
      );
      t.equal(assets[0].keyholders, '50', `${given}: should have the right amount of keyholders`);
      t.equal(assets[0].txsCount, '2', `${given}: should have 2 txsCount`);
      const assetTxs = await assetTxsDAL.findAll();
      t.assert(assetTxs.length > 0, `${given}: There should be rows in the AssetTxs table`);
      t.equal(
        assetTxs.every((a) => a.asset === '00'),
        true,
        `${given}: all rows in AssetTxs should have asset = 00`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given new blocks with a falsy transaction', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyTransaction: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      await blocksAdder.doJob({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with a falsy output', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyOutput: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      await blocksAdder.doJob({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with a falsy input', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyInput: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      await blocksAdder.doJob({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with an outpoint input', async (given) => {
    const TEST_BLOCK_NUMBER = 86;
    const OUTPOINT_BLOCK_NUMBER = 1;
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      // add 1st block as the tested input references this
      await blocksAdder.doJob({
        data: { limitBlocks: 1 },
      });
      await createDemoBlocksFromTo(
        2,
        TEST_BLOCK_NUMBER - 1,
        '0000000001286157818c62beede85613a0293c66abe795a2397b6487e72d29d0'
      );
      // this is the tested block with an outpoint input
      await blocksAdder.doJob({
        data: { limitBlocks: 1 },
      });

      const inputs = await inputsDAL.findAll({
        where: {
          isMint: false,
        },
        limit: 1,
      });
      t.assert(inputs.length > 0, `${given}: There should be at least one outpoint input in db`);
      const input = inputs[0];
      t.assert(input.outputId > 0, `${given}: outputId should be set on this input`);
      const output = await input.getOutput();
      t.equals(
        output.blockNumber,
        OUTPOINT_BLOCK_NUMBER,
        `${given}: The input tested should have its outpoint pointing to block 1`
      );
      t.equal(
        input.lockType,
        output.lockType,
        `${given}: input and outpoint should have same lockType`
      );
      t.equal(
        input.address,
        output.address,
        `${given}: input and outpoint should have same address`
      );
      t.equal(input.asset, output.asset, `${given}: input and outpoint should have same asset`);
      t.equal(input.amount, output.amount, `${given}: input and outpoint should have same amount`);
    } catch (error) {
      t.fail(`${given}: should not throw an error`);
    }
  });
  await wrapTest('Given a transaction with a mint input', async (given) => {
    const TEST_BLOCK_NUMBER = 176;
    // only 1 minted asset in all of the blocks
    const MINTED_ASSET_ID =
      '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      await createDemoBlocksFromTo(
        1,
        TEST_BLOCK_NUMBER - 1,
        '00000000000fad5999c26f7d37331082f6558ff8f809cdf0845c071af2bff7e2'
      );
      await blocksAdder.doJob({
        data: { limitBlocks: 1 },
      });

      const inputs = await inputsDAL.findAll({
        where: {
          isMint: true,
        },
        limit: 1,
      });
      t.assert(inputs.length > 0, `${given}: There should be at least one mint input in db`);
      t.equal(inputs[0].asset, MINTED_ASSET_ID, `${given}: Asset should be set`);
      t.assert(
        typeof inputs[0].amount === 'string' && Number(inputs[0].amount) > 0,
        `${given}: Amount should be set`
      );

      const asset = await assetsDAL.findById(MINTED_ASSET_ID);
      t.equal(asset.issued, '120000000', `${given}: The asset should have the right issued amount`);
      t.equal(asset.destroyed, '0', `${given}: The asset should have the right destroyed amount`);
      t.equal(
        asset.outstanding,
        '120000000',
        `${given}: The asset should have the right outstanding amount`
      );
      t.equal(asset.keyholders, '2', `${given}: The asset should have the right keyholders amount`);
      t.equal(asset.txsCount, '2', `${given}: The asset should have the right txsCount amount`);
      const assetTxs = await assetTxsDAL.findAllByAsset(MINTED_ASSET_ID);
      t.equal(assetTxs.length, 2, `${given}: There should be 2 AssetTxs in the db`);
    } catch (error) {
      t.fail(`${given}: should not throw an error`);
    }
  });
  await wrapTest('Given an address which received and sent', async (given) => {
    /**
     * zen11 receives coinbase in block 1
     * zen13 receives coinbase in block 2
     * zen11 sends 1 ZP to zen12 in block 2
     */
    const block1 = {
      hash: '1',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        1: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen11',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
      },
    };
    const block2 = {
      hash: '2',
      header: {
        version: 0,
        parent: '1',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        2: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen13',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
        3: {
          version: 0,
          inputs: [
            {
              outpoint: {
                txHash: '1',
                index: 0,
              },
            },
          ],
          outputs: [
            {
              lock: {
                PK: {
                  hash: '7dbb8068630bed0ec68d0eccf19ab3a0e90895ada230e41072eb0dd8e2c4f190',
                  address: 'zen12',
                },
              },
              spend: {
                asset: '00',
                amount: 100000000,
              },
            },
            {
              lock: {
                PK: {
                  hash: 'fd517e12c3670db13143b0bd5d3115263c7c7874b9f5fa67bc59a850aafba5e5',
                  address: 'zen11',
                },
              },
              spend: {
                asset: '00',
                amount: 4900000000,
              },
            },
          ],
        },
      },
    };
    const blockchain = [block1, block2];
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getBlockFromNode = (blockNumber) => {
      return blockchain[blockNumber - 1];
    };
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      const { count } = await blocksAdder.doJob();

      t.assert(count === 2, `${given}: Should have added 2 new blocks`);

      const addresses = await addressesDAL.findAll();
      t.assert(addresses.length === 3, `${given}: There should be 3 rows in Addresses table`);
      const filterFields = (a) => {
        const { asset, inputSum, outputSum, balance } = a;
        return { asset, inputSum, outputSum, balance };
      };
      const zen11 = addresses.find((a) => a.address === 'zen11');
      const zen12 = addresses.find((a) => a.address === 'zen12');
      const zen13 = addresses.find((a) => a.address === 'zen13');
      t.deepEqual(
        filterFields(zen11),
        { asset: '00', inputSum: '5000000000', outputSum: '9900000000', balance: '4900000000' },
        `${given}: zen11 should have the right amounts`
      );
      t.deepEqual(
        filterFields(zen12),
        { asset: '00', inputSum: '0', outputSum: '100000000', balance: '100000000' },
        `${given}: zen12 should have the right amounts`
      );
      t.deepEqual(
        filterFields(zen13),
        { asset: '00', inputSum: '0', outputSum: '5000000000', balance: '5000000000' },
        `${given}: zen13 should have the right amounts`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given an asset which was minted and destroyed', async (given) => {
    const ASSET_ID = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
    /**
     * block1 is genesis
     * block 2 asset was minted
     * block 3 asset was destroyed
     */
    const block1 = {
      hash: '1',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        1: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen11',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
      },
    };
    const block2 = {
      hash: '2',
      header: {
        version: 0,
        parent: '1',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        2: {
          version: 0,
          inputs: [
            {
              mint: {
                asset: ASSET_ID,
                amount: 100000000,
              },
            },
          ],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen13',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
      },
    };
    const block3 = {
      hash: '3',
      header: {
        version: 0,
        parent: '2',
        blockNumber: 3,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        3: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 3,
                  address: 'zen13',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
            {
              lock: 'Destroy',
              spend: {
                asset: ASSET_ID,
                amount: 100000000,
              },
            },
          ],
        },
      },
    };
    const blockchain = [block1, block2, block3];
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 3 });
    networkHelper.getBlockFromNode = (blockNumber) => {
      return blockchain[blockNumber - 1];
    };
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      const { count } = await blocksAdder.doJob();

      t.assert(count === 3, `${given}: Should have added 3 new blocks`);

      const asset = await assetsDAL.findById(ASSET_ID);
      const filterFields = (a) => {
        const { issued, destroyed, outstanding } = a;
        return { issued, destroyed, outstanding };
      };
      t.deepEqual(
        filterFields(asset),
        { issued: '100000000', destroyed: '100000000', outstanding: '0' },
        `${given}: the asset should have the right amounts`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest(
    'Given an asset which was minted and destroyed on the same block',
    async (given) => {
      const ASSET_ID = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
      /**
       * block1 is genesis
       * block 2 asset was minted and destroyed
       */
      const block1 = {
        hash: '1',
        header: {
          version: 0,
          parent: '0000000000000000000000000000000000000000000000000000000000000000',
          blockNumber: 1,
          commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044087,
          difficulty: 471719622,
          nonce: [8015528688734519415, 5802497780545032333],
        },
        transactions: {
          1: {
            version: 0,
            inputs: [],
            outputs: [
              {
                lock: {
                  Coinbase: {
                    blockNumber: 1,
                    address: 'zen11',
                  },
                },
                spend: {
                  asset: '00',
                  amount: 5000000000,
                },
              },
            ],
          },
        },
      };
      const block2 = {
        hash: '2',
        header: {
          version: 0,
          parent: '1',
          blockNumber: 2,
          commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044088,
          difficulty: 471719622,
          nonce: [8015528688734519415, 5802497780545032333],
        },
        transactions: {
          2: {
            version: 0,
            inputs: [
              {
                mint: {
                  asset: ASSET_ID,
                  amount: 100000000,
                },
              },
            ],
            outputs: [
              {
                lock: {
                  Coinbase: {
                    blockNumber: 1,
                    address: 'zen13',
                  },
                },
                spend: {
                  asset: '00',
                  amount: 5000000000,
                },
              },
              {
                lock: 'Destroy',
                spend: {
                  asset: ASSET_ID,
                  amount: 100000000,
                },
              },
            ],
          },
        },
      };
      const blockchain = [block1, block2];
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
      networkHelper.getBlockFromNode = (blockNumber) => {
        return blockchain[blockNumber - 1];
      };
      const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

      try {
        await blocksAdder.doJob();

        const asset = await assetsDAL.findById(ASSET_ID);
        const filterFields = (a) => {
          const { issued, destroyed, outstanding } = a;
          return { issued, destroyed, outstanding };
        };
        t.deepEqual(
          filterFields(asset),
          { issued: '100000000', destroyed: '100000000', outstanding: '0' },
          `${given}: the asset should have the right amounts`
        );
      } catch (error) {
        t.fail(`${given}: Should not throw an error`);
      }
    }
  );
  await wrapTest('Given a block with a contract', async (given) => {
    const CONTRACT_ID = '000000002f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0';
    const CONTRACT_ADDRESS = 'czen1qqqqqqqp00js3cc4qkv8nc4a3ud7p6nsn4adgw6v4mnzuz239hjkcqk87uqvv6lt4';
    /**
     * block1 is genesis
     * block 2 has a contract activation
     */
    const block1 = {
      hash: '1',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        1: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen11',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
      },
    };
    const block2 = {
      hash: '2',
      header: {
        version: 0,
        parent: '1',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        2: {
          version: 0,
          inputs: [],
          outputs: [],
          contract: {
            contractId: CONTRACT_ID,
            address: CONTRACT_ADDRESS,
            expire: 40950,
            code: 'test'
          },
        },
      },
    };
    const blockchain = [block1, block2];
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getBlockFromNode = (blockNumber) => {
      return blockchain[blockNumber - 1];
    };
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser('test'), '20000000');

    try {
      await blocksAdder.doJob();

      const contract = await contractsDAL.findById(CONTRACT_ID);
      const filterFields = (a) => {
        const { address, version, code, txsCount, assetsIssued, lastActivationBlock } = a;
        return { address, version, code, txsCount, assetsIssued, lastActivationBlock };
      };
      t.deepEqual(
        filterFields(contract),
        { address: CONTRACT_ADDRESS, version: 0, code: 'test', txsCount: '0', assetsIssued: '0', lastActivationBlock: 2 },
        `${given}: the contract should have the right data`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given a block with a contract, mint and pk with contract address', async (given) => {
    const CONTRACT_ID = '000000002f7ca11c62a0b30f3c57b1e37c1d4e13af5a876995dcc5c12a25bcad8058fee0';
    const CONTRACT_ADDRESS = 'czen1qqqqqqqp00js3cc4qkv8nc4a3ud7p6nsn4adgw6v4mnzuz239hjkcqk87uqvv6lt4';
    /**
     * block1 is genesis
     * block 2 has a contract activation
     */
    const block1 = {
      hash: '1',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        1: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen11',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
      },
    };
    const block2 = {
      hash: '2',
      header: {
        version: 0,
        parent: '1',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: [8015528688734519415, 5802497780545032333],
      },
      transactions: {
        2: {
          version: 0,
          inputs: [],
          outputs: [],
          contract: {
            contractId: CONTRACT_ID,
            address: CONTRACT_ADDRESS,
            expire: 40950,
            code: 'test'
          },
        },
        3: {
          version: 0,
          inputs: [
            {
              mint: {
                asset: CONTRACT_ID,
                amount: 100000000,
              },
            },
            {
              outpoint: {
                txHash: '1',
                index: 0,
              },
            },
          ],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 1,
                  address: 'zen13',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
            {
              lock: {
                PK: {
                  hash: 'fd517e12c3670db13143b0bd5d3115263c7c7874b9f5fa67bc59a850aafba5e5',
                  address: CONTRACT_ADDRESS,
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
          contract: {
            contractId: CONTRACT_ID,
            address: CONTRACT_ADDRESS,
            expire: 40950,
            code: 'test'
          },
        },
      },
    };
    const blockchain = [block1, block2];
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getBlockFromNode = (blockNumber) => {
      return blockchain[blockNumber - 1];
    };
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser('test'), '20000000');

    try {
      await blocksAdder.doJob();

      const contract = await contractsDAL.findById(CONTRACT_ID);
      const filterFields = (a) => {
        const { address, version, code, txsCount, assetsIssued, lastActivationBlock } = a;
        return { address, version, code, txsCount, assetsIssued, lastActivationBlock };
      };
      t.deepEqual(
        filterFields(contract),
        { address: CONTRACT_ADDRESS, version: 0, code: 'test', txsCount: '1', assetsIssued: '1', lastActivationBlock: 2 },
        `${given}: the contract should have the right data`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest(
    'Given a node block with parent not equal to last block hash in db',
    async (given) => {
      const TEST_BLOCK_NUMBER = 4;
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
      const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

      try {
        await createDemoBlocksFromTo(
          1,
          TEST_BLOCK_NUMBER - 1,
          '12345' // last hash would be wrong! - reorg
        );
        await blocksAdder.doJob({
          data: { limitBlocks: 1 },
        });

        t.fail(`${given}: Should throw an error`);
      } catch (error) {
        t.equal(error.message, 'Reorg', `${given}: Should throw a Reorg error`);
      }
    }
  );
});

if (Config.get('RUN_REAL_DATA_TESTS')) {
  test('Add New Blocks with real data from node (NO MOCK)', async function (t) {
    await truncate();
    const networkHelper = new NetworkHelper();
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser(), '20000000');

    try {
      const { count } = await blocksAdder.doJob({ data: { limitBlocks: 200 } });
      t.assert(count > 0, 'Should have added new blocks');

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlockAfterAdd !== null, 'There should be new blocks in the db');
    } catch (error) {
      console.log('An error had occurred trying to get the chain info! check the node status!!!');
      t.fail('Should not throw an error');
    }
  });
}
