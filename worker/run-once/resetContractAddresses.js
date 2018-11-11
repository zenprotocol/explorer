/**
 * A one time script to go over all of the contract outputs and
 * override their address with the one from the node
 */

const outputsDAL = require('../../server/components/api/outputs/outputsDAL');
const infosDAL = require('../../server/components/api/infos/infosDAL');
const logger = require('../lib/logger')('resetContractAddresses');
const NetworkHelper = require('../lib/NetworkHelper');
const BlockchainParser = require('../../server/lib/BlockchainParser');

const networkHelper = new NetworkHelper();
const blockchainParser = new BlockchainParser();

const run = async () => {
  const chain = await getChainName();
  blockchainParser.setChain(chain);
  const contractsDictionary = {}; // search here first before fetching from the node
  const contractOutputs = await outputsDAL.findAll({
    where: {
      lockType: 'Contract',
    },
    include: [
      {
        model: outputsDAL.db.Transaction,
        include: [
          {
            model: outputsDAL.db.Block,
          },
        ],
      },
    ],
  });
  for (let i = 0; i < contractOutputs.length; i += 1) {
    const output = contractOutputs[i];
    let address = null;
    if (contractsDictionary[output.lockValue]) {
      address = contractsDictionary[output.lockValue];
    } else {
      address = await getAddressFromNode(output);
      contractsDictionary[output.lockValue] = address;
    }

    if (address) {
      await outputsDAL.update(output.id, {address});
    }
  }
  return contractsDictionary;
};

const getAddressFromNode = async output => {
  const nodeBlock = await networkHelper.getBlockFromNode(output.Transaction.Block.blockNumber);
  const { address } = blockchainParser.getLockValuesFromOutput(
    nodeBlock.transactions[output.Transaction.hash].outputs[output.index]
  );
  return address;
};

const getChainName = async () => {
  const chain = await infosDAL.findOne({
    where: {
      name: 'chain'
    }
  });
  return chain.value;
}; 

run()
  .then(() => {
    logger.info('Finished changing all the contract addresses');
  })
  .catch(err => {
    logger.error(`An Error has occurred when changing contract addresses: ${err.message}`);
  })
  .then(() => {
    outputsDAL.db.sequelize.close();
  });
