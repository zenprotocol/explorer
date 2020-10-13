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
const infosDAL = require('../../../../server/components/api/infos/infosDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlockchainParser = require('../../../../server/lib/BlockchainParser');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');
const Config = require('../../../../server/config/Config');
const mock = require('./mock');
const BlocksAdder = require('../BlocksAdder');
const serializeBlock = require('./data/serializeBlock');

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
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    try {
      const { count, latest } = await blocksAdder.doJob({
        data: { limitBlocks: 2 },
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

      // check infos
      const infos = await infosDAL.findAll();
      t.assert(infos.length > 0, `${given}: Should add infos`);
      t.assert(
        infos.some((i) => ['chain', 'blocks', 'headers', 'difficulty'].includes(i.name)),
        `${given}: Should add blockchain infos`
      );
      t.assert(
        infos.some((i) => i.name === 'hashRate'),
        `${given}: Should add hashRate`
      );
      t.assert(
        infos.some((i) => i.name === 'txsCount'),
        `${given}: Should add txsCount`
      );
      t.assert(
        infos.some((i) => i.name === 'cgpBalance'),
        `${given}: Should add cgpBalance`
      );
      t.assert(
        infos.some((i) => i.name === 'cgpAllocation'),
        `${given}: Should add cgpAllocation`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });

  await wrapTest('Given some already in DB', async (given) => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    // add demo first block in DB
    await blocksDAL.create({
      version: 0,
      hash: 'cae179c83c877c40ac9346bf942c99e387ebd5a980a81579c9b8303a0646fb50',
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
        data: { limitBlocks: 1 },
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
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

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
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    try {
      const { count } = await blocksAdder.doJob({
        data: { limitBlocks: 2 },
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
  await wrapTest('Given a block with 2 transactions', async (given) => {
    const block1 = {
      hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                  address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
        '395e22aaeda855eb4140b694f03a624e715387b208224f6ad2c03a2e62c7a9aa': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
                  address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
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
      hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
      header: {
        version: 0,
        parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '6dd446057050b1e4555a6ea37bfa7fca5dc0f830188b0090f2e0a0d45c61491b': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 2,
                  address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                  pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
        '23b946071b524e58bf862d913e85aa38e2a4dc698ee7a99e283f27f555f1cf39': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: '697e891b26cfdac380aa85b79efb64cb835c59a8930c46038e259d844595fb69',
                  address: 'zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m',
                },
              },
              spend: {
                asset: '00',
                amount: 100000000,
              },
            },
          ],
        },
      },
    };

    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getSerializedBlocksFromNode = () => {
      return Promise.resolve([
        {
          blockNumber: 2,
          rawBlock: serializeBlock(block2),
        },
        {
          blockNumber: 1,
          rawBlock: serializeBlock(block1),
        },
      ]);
    };
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    try {
      await blocksAdder.doJob();

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
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given a transaction with an outpoint input', async (given) => {
    const TEST_BLOCK_NUMBER = 86;
    const OUTPOINT_BLOCK_NUMBER = 1;
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

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
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

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
     * zen11: zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf
     * zen12: zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m
     * zen13: zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a
     */
    /**
     * zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf receives coinbase in block 1
     * zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a receives coinbase in block 2
     * zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf sends 1 ZP to zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m in block 2
     */
    const block1 = {
      hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                  address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
      hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
      header: {
        version: 0,
        parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '395e22aaeda855eb4140b694f03a624e715387b208224f6ad2c03a2e62c7a9aa': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 2,
                  address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                  pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
                },
              },
              spend: {
                asset: '00',
                amount: 5000000000,
              },
            },
          ],
        },
        '23b946071b524e58bf862d913e85aa38e2a4dc698ee7a99e283f27f555f1cf39': {
          version: 0,
          inputs: [
            {
              outpoint: {
                txHash: '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30',
                index: 0,
              },
            },
          ],
          outputs: [
            {
              lock: {
                PK: {
                  hash: '697e891b26cfdac380aa85b79efb64cb835c59a8930c46038e259d844595fb69',
                  address: 'zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m',
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
                  hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                  address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getSerializedBlocksFromNode = () => {
      return Promise.resolve([
        {
          blockNumber: 2,
          rawBlock: serializeBlock(block2),
        },
        {
          blockNumber: 1,
          rawBlock: serializeBlock(block1),
        },
      ]);
    };
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    try {
      const { count } = await blocksAdder.doJob();

      t.assert(count === 2, `${given}: Should have added 2 new blocks`);

      const addresses = await addressesDAL.findAll();
      t.assert(addresses.length === 3, `${given}: There should be 3 rows in Addresses table`);
      const filterFields = (a) => {
        const { asset, inputSum, outputSum, balance } = a;
        return { asset, inputSum, outputSum, balance };
      };
      const zen11 = addresses.find(
        (a) => a.address === 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf'
      );
      const zen12 = addresses.find(
        (a) => a.address === 'zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m'
      );
      const zen13 = addresses.find(
        (a) => a.address === 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a'
      );
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
     * zen11: zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf
     * zen12: zen1qd9lgjxexeldv8q92skmea7myewp4ckdgjvxyvquwykwcg3v4ld5s48907m
     * zen13: zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a
     */
    /**
     * block1 is genesis
     * block 2 asset was minted
     * block 3 asset was destroyed
     */
    const block1 = {
      hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                  address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
      hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
      header: {
        version: 0,
        parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '6fb85d684c1a071917b05aba7997c9f9c9bb630f55bbeb53efde701bdd1dfb0b': {
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
                  blockNumber: 2,
                  address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                  pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
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
      hash: 'f56fe1b271ed10e55e2f81e22d30195e13d1d422ca71de497a351b863272a741',
      header: {
        version: 0,
        parent: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
        blockNumber: 3,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        ff1a817aeec8264e4f9c5ed74cc29cfa33cc0222b16a5f5b28db35c9d3437e94: {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                Coinbase: {
                  blockNumber: 3,
                  address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                  pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
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
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 3 });
    networkHelper.getSerializedBlocksFromNode = () => {
      return Promise.resolve([
        {
          blockNumber: 3,
          rawBlock: serializeBlock(block3),
        },
        {
          blockNumber: 2,
          rawBlock: serializeBlock(block2),
        },
        {
          blockNumber: 1,
          rawBlock: serializeBlock(block1),
        },
      ]);
    };
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

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
        hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        header: {
          version: 0,
          parent: '0000000000000000000000000000000000000000000000000000000000000000',
          blockNumber: 1,
          commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044087,
          difficulty: 471719622,
          nonce: ['8015528688734519415', '5802497780545032333'],
        },
        transactions: {
          '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
            version: 0,
            inputs: [],
            outputs: [
              {
                lock: {
                  PK: {
                    hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                    address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
        hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
        header: {
          version: 0,
          parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
          blockNumber: 2,
          commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044088,
          difficulty: 471719622,
          nonce: ['8015528688734519415', '5802497780545032333'],
        },
        transactions: {
          '4f93f59a937edcf1f17ad738ff85098294d550a45fdb90e8d237229e913a9fae': {
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
                    address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                    pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
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
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
      networkHelper.getSerializedBlocksFromNode = () => {
        return Promise.resolve([
          {
            blockNumber: 2,
            rawBlock: serializeBlock(block2),
          },
          {
            blockNumber: 1,
            rawBlock: serializeBlock(block1),
          },
        ]);
      };
      const blocksAdder = new BlocksAdder({
        networkHelper,
        blockchainParser: new BlockchainParser(),
        genesisTotalZp: '20000000',
        chain: 'main',
        cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
      });

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
    const CONTRACT_ID = '0000000085d4c3f4f85c228e699b32d9b83875b7f2197c564e101d3a8e6d988e5c4ade37';
    const CONTRACT_ADDRESS =
      'czen1qqqqqqqy96nplf7zuy28xnxejmxursadh7gvhc4jwzqwn4rndnz89cjk7xufhuseh';
    /**
     * block1 is genesis
     * block 2 has a contract activation
     */
    const block1 = {
      hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
      header: {
        version: 0,
        parent: '0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 1,
        commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044087,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
          version: 0,
          inputs: [],
          outputs: [
            {
              lock: {
                PK: {
                  hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                  address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
      hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
      header: {
        version: 0,
        parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        blockNumber: 2,
        commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
        timestamp: 1530378044088,
        difficulty: 471719622,
        nonce: ['8015528688734519415', '5802497780545032333'],
      },
      transactions: {
        '87900cf62d156ca60099ec4176dc28e38cced4ceecdee5d70ad2a8979e6e8df8': {
          version: 0,
          inputs: [],
          outputs: [],
          contract: {
            code: 'test',
          },
        },
      },
    };
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
    networkHelper.getSerializedBlocksFromNode = () => {
      return Promise.resolve([
        {
          blockNumber: 2,
          rawBlock: serializeBlock(block2),
        },
        {
          blockNumber: 1,
          rawBlock: serializeBlock(block1),
        },
      ]);
    };
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

    try {
      await blocksAdder.doJob();

      const contract = await contractsDAL.findById(CONTRACT_ID);
      const filterFields = (a) => {
        const { address, version, code, txsCount, assetsIssued, lastActivationBlock } = a;
        return { address, version, code, txsCount, assetsIssued, lastActivationBlock };
      };
      t.deepEqual(
        filterFields(contract),
        {
          address: CONTRACT_ADDRESS,
          version: 0,
          code: 'test',
          txsCount: '0',
          assetsIssued: '0',
          lastActivationBlock: 2,
        },
        `${given}: the contract should have the right data`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest(
    'Given a block with a contract, mint and pk with contract address',
    async (given) => {
      const CONTRACT_ID =
        '0000000085d4c3f4f85c228e699b32d9b83875b7f2197c564e101d3a8e6d988e5c4ade37';
      const CONTRACT_ADDRESS =
        'czen1qqqqqqqy96nplf7zuy28xnxejmxursadh7gvhc4jwzqwn4rndnz89cjk7xufhuseh';
      /**
       * block1 is genesis
       * block 2 has a contract activation
       */
      const block1 = {
        hash: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
        header: {
          version: 0,
          parent: '0000000000000000000000000000000000000000000000000000000000000000',
          blockNumber: 1,
          commitments: '626a22feb6275762b45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044087,
          difficulty: 471719622,
          nonce: ['8015528688734519415', '5802497780545032333'],
        },
        transactions: {
          '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30': {
            version: 0,
            inputs: [],
            outputs: [
              {
                lock: {
                  PK: {
                    hash: 'db82dd716d10015fa28ac79e9d7734f876cc017b7a19d303e36197e2b81c4c4f',
                    address: 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf',
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
        hash: 'cbf83cd431f417552de810a55f69837888533d60a8e35d0b6be78f8fa1e6b0c8',
        header: {
          version: 0,
          parent: 'd45ced8e8926de5ae36dffa9cfdd992c61d99fd8cfcc770196a80830c08daeed',
          blockNumber: 2,
          commitments: '626a22feb6275762c45b8a5a329296343343efbd6ccea80d7f1ebf63d8b0efcf',
          timestamp: 1530378044088,
          difficulty: 471719622,
          nonce: ['8015528688734519415', '5802497780545032333'],
        },
        transactions: {
          '39e746dc19f9ee593d9f5b776c8f08bac2181c6375a21522cd99149f4260bbd9': {
            version: 0,
            inputs: [],
            outputs: [],
            contract: {
              code: 'test',
            },
          },
          '06061e97d531298c65935469ac052256bf0cb03e40747511b3d4eeadd81cbc45': {
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
                  txHash: '2ff5284f9a8cbde0a32523332a04cfc242b86adb911b0467a80b7767a1da7a30',
                  index: 0,
                },
              },
            ],
            outputs: [
              {
                lock: {
                  Coinbase: {
                    blockNumber: 1,
                    address: 'zen1qtx3k4hk3f5ldlw3nz5hmqqv30t95zh6vhdaa2fjtaxwyhspht3xqe0mv9a',
                    pkHash: '59a36aded14d3edfba33152fb001917acb415f4cbb7bd5264be99c4bc0375c4c',
                  },
                },
                spend: {
                  asset: '00',
                  amount: 5000000000,
                },
              },
              {
                lock: {
                  Contract: {
                    id: CONTRACT_ID,
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
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: 2 });
      networkHelper.getSerializedBlocksFromNode = () => {
        return Promise.resolve([
          {
            blockNumber: 2,
            rawBlock: serializeBlock(block2),
          },
          {
            blockNumber: 1,
            rawBlock: serializeBlock(block1),
          },
        ]);
      };
      const blocksAdder = new BlocksAdder({
        networkHelper,
        blockchainParser: new BlockchainParser(),
        genesisTotalZp: '20000000',
        chain: 'main',
        cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
      });

      try {
        await blocksAdder.doJob();

        const contract = await contractsDAL.findById(CONTRACT_ID);
        const filterFields = (a) => {
          const { address, version, code, txsCount, assetsIssued, lastActivationBlock } = a;
          return { address, version, code, txsCount, assetsIssued, lastActivationBlock };
        };
        t.deepEqual(
          filterFields(contract),
          {
            address: CONTRACT_ADDRESS,
            version: 0,
            code: 'test',
            txsCount: '1',
            assetsIssued: '1',
            lastActivationBlock: 2,
          },
          `${given}: the contract should have the right data`
        );
      } catch (error) {
        t.fail(`${given}: Should not throw an error`);
      }
    }
  );
  await wrapTest(
    'Given a node block with parent not equal to last block hash in db',
    async (given) => {
      const TEST_BLOCK_NUMBER = 4;
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
      const blocksAdder = new BlocksAdder({
        networkHelper,
        blockchainParser: new BlockchainParser(),
        genesisTotalZp: '20000000',
        chain: 'main',
        cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
      });

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
    const blocksAdder = new BlocksAdder({
      networkHelper,
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });

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
