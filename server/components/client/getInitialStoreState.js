
const blocksBLL = require('../api/blocks/blocksBLL');

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

  await Promise.all(promises);
  return initialState;
};
