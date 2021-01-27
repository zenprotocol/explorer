/**
 * Re-calculates all data in Addresses, AddressTxs, Assets, AssetTxs
 */
const readline = require('readline');
const colors = require('colors');
const logger = require('../lib/logger')('calc-addresses');
const addressesDAL = require('../../server/components/api/addresses/addressesDAL');
const addressTxsDAL = require('../../server/components/api/address-txs/addressTxsDAL');
const assetsDAL = require('../../server/components/api/assets/assetsDAL');
const assetTxsDAL = require('../../server/components/api/asset-txs/assetTxsDAL');
const db = require('../../server/db/sequelize/models');
const { exit } = require('process');

const run = async () => {
  console.log(colors.yellow('\nRecalculate all addresses amounts'));
  console.log(
    colors.red(
      'MAKE SURE BLOCKS ARE NOT ADDED DURING THIS OPERATION, IT WILL MAKE THE CALCULATION WRONG!\n'
    )
  );

  const readlineAsync = ReadLineAsync();
  const value = await readlineAsync.question(
    'This operation is expensive and will override data in the database, are you sure? (Yes/No): '
  );
  if (!['y', 'yes'].includes(value.toLowerCase())) {
    console.log('No');
    exit(0);
  }

  const dbTransaction = await db.sequelize.transaction();

  try {
    // delete all data first
    logger.info('deleting all data from tables...');
    await addressesDAL.bulkDelete({
      transaction: dbTransaction,
      truncate: true,
    });
    await addressTxsDAL.bulkDelete({
      transaction: dbTransaction,
      truncate: true,
    });
    await assetsDAL.bulkDelete({
      transaction: dbTransaction,
      truncate: true,
    });
    await assetTxsDAL.bulkDelete({
      transaction: dbTransaction,
      truncate: true,
    });

    // ADDRESSES ---
    // fetch one by one to ease on the DB and provide user feedback
    logger.info('querying for all addresses...');
    const allAddresses = await addressesDAL.snapshotCurrentAmountsForAll({ dbTransaction });
    logger.info('querying for all addresses txs count...');
    const addressesTxsCount = await addressesDAL.countTxsPerAddress({ dbTransaction });

    logger.info('queried all needed address data');

    logger.info('calculating address values...');
    const addressValues = allAddresses.map((address) => ({
      address: address.address,
      asset: address.asset,
      inputSum: address.input_sum,
      outputSum: address.output_sum,
      balance: address.balance,
      txsCount: (addressesTxsCount.find((o) => o.address === address.address) || { txsCount: 0 })
        .txsCount,
    }));
    logger.info('bulk inserting addresses...');
    await addressesDAL.bulkCreate(addressValues, { transaction: dbTransaction });
    logger.info('bulk inserting address txs...');
    await addressesDAL.insertAllAddressTxs({ dbTransaction });

    // ASSETS --- (some queries are dependant on addresses)
    logger.info('querying for all assets...');
    const allAssets = await assetsDAL.snapshotCurrentAmountsForAll({ dbTransaction });
    logger.info('querying for ZP amounts...');
    const assetZp = await assetsDAL.snapshotCurrentAmountsForZP({ dbTransaction });
    logger.info('querying for all assets txs count...');
    const assetTxsCount = await assetsDAL.countTxsPerAsset({ dbTransaction });
    logger.info('querying for all assets keyholders...');
    const assetKeyholders = await addressesDAL.countKeyholdersPerAsset({ dbTransaction });
    logger.info('queried all needed asset data');

    logger.info('calculating assets values...');
    const assetsValues = allAssets.map((asset) => ({
      asset: asset.asset,
      issued: asset.issued,
      destroyed: asset.destroyed,
      outstanding: asset.outstanding,
      keyholders: (assetKeyholders.find((o) => o.asset === asset.asset) || { keyholders: 0 })
        .keyholders,
      txsCount: (assetTxsCount.find((o) => o.asset === asset.asset) || { txsCount: 0 }).txsCount,
    }));
    assetsValues.unshift({
      asset: assetZp.asset,
      issued: assetZp.issued,
      destroyed: assetZp.destroyed,
      outstanding: assetZp.outstanding,
      keyholders: (assetKeyholders.find((o) => o.asset === assetZp.asset) || { keyholders: 0 })
        .keyholders,
      txsCount: (assetTxsCount.find((o) => o.asset === assetZp.asset) || { txsCount: 0 }).txsCount,
    });
    
    logger.info('bulk inserting assets...');
    await assetsDAL.bulkCreate(assetsValues, { transaction: dbTransaction });
    logger.info('bulk inserting asset txs...');
    await assetsDAL.insertAllAssetTxs({ dbTransaction });
    
    logger.info('committing the database transaction');
    await dbTransaction.commit();

    await db.sequelize.close();
  } catch (error) {
    if (dbTransaction) {
      logger.info('Rollback the database transaction');
      await dbTransaction.rollback();
    }
    await db.sequelize.close();
    throw error;
  }
};

run()
  .then(() => {
    logger.info('Finished updating all addresses');
    exit(0);
  })
  .catch((err) => {
    console.log(err);
    logger.error(`An Error has occurred: ${err.message}`);
    exit(1);
  });

function ReadLineAsync() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function question(query) {
    return new Promise((res) => {
      rl.question(query, res);
    });
  }

  function close() {
    rl.close();
  }

  return {
    question,
    close,
  };
}
