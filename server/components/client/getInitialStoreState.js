
const blocksBLL = require('../api/blocks/blocksBLL');
const transactionsBLL = require('../api/transactions/transactionsBLL');

module.exports = async req => {
  const { routeName } = req;
  const initialState = {
    addressStore: {},
    assetStore: {},
    blockStore: {},
    contractStore: {},
    infoStore: {},
    searchStore: {},
    transactionStore: {},
    uiStore: {},
  };
  const promises = [];
  // blocks
  promises.push(blocksBLL.count().then(count => (initialState.blockStore.blocksCount = count)));

  if (routeName === 'block') {
    const hashOrBlockNumber = req.params.hashOrBlockNumber;
    promises.push(
      blocksBLL
        .findByHashOrBlockNumber({ hashOrBlockNumber: hashOrBlockNumber })
        .then(block => {
          initialState.blockStore.block = block;
          initialState.blockStore.hashOrBlockNumber = hashOrBlockNumber;
        })
    );
  }
  else if(routeName === 'tx') {
    const hash = req.params.hash;
    promises.push(
      transactionsBLL
        .findOne({ hash })
        .then(tx => {
          initialState.transactionStore.transaction = tx;
        })
    );
  }

  await Promise.all(promises);
  return initialState;
};
