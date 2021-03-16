'use strict';

const assetsDAL = require('./assetsDAL');
const contractsDAL = require('../contracts/contractsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getAssetName = require('../../../lib/getAssetName');
const getContractName = require('../../../lib/getContractName');
const BlockchainParser = require('../../../lib/BlockchainParser');
const getChain = require('../../../lib/getChain');

module.exports = {
  findAll: async function ({ page = 0, pageSize = 10, sorted } = {}) {
    const bcParser = new BlockchainParser(await getChain());
    const sortBy =
        sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'keyholders', desc: true }];
    const query = createQueryObject({ page, pageSize, sorted: sortBy});
    return await Promise.all([assetsDAL.count(), assetsDAL.findAll(query)])
      .then(([count, items]) => {
        return [
          count,
          items.map((item) => {
            const contractId = getContractId(item.asset);
            let address = '';
            try {
              address = bcParser.getAddressFromContractId(contractId);
            } catch (error) {}
            return {
              ...item.toJSON(),
              metadata: getAssetMetaData(item.asset),
              contract: {
                id: contractId,
                address,
                metadata: getContractMetaData(contractId),
              },
            };
          }),
        ];
      })
      .then(assetsDAL.getItemsAndCountResult);
  },
  findOne: async function ({ asset } = {}) {
    if (!asset) {
      return null;
    }

    const contractId = asset.substring(0, 72);

    const [assetOutstanding, contract, chain] = await Promise.all([
      assetsDAL.findById(asset).then(assetsDAL.toJSON),
      contractsDAL.findById(contractId),
      getChain(),
    ]);
    if (assetOutstanding) {
      return Object.assign(
        {},
        assetOutstanding,
        {
          subType: getSubType(asset, chain),
        },
        {
          metadata: getAssetMetaData(asset),
          contract: Object.assign({}, contract && { id: contract.id, address: contract.address }, {
            metadata: getContractMetaData(contractId),
          }),
        }
      );
    }
    return null;
  },
  keyholders: async function ({ asset, page = 0, pageSize = 10 } = {}) {
    if (!asset) {
      return [];
    }

    const query = createQueryObject({ page, pageSize });
    return await assetsDAL.keyholders(Object.assign({ asset }, query));
  },
};

function getContractId(assetId) {
  return assetId === '00' ? '' : assetId.substring(0, 72);
}

function getContractMetaData(id) {
  return !id || id === '00' ? { name: '', shortName: '' } : getContractName(id);
}

function getAssetMetaData(asset) {
  return !asset || asset === '00' ? { name: 'ZP', shortName: 'ZP' } : getAssetName(asset);
}

function getSubType(assetId, chain) {
  const bcParser = new BlockchainParser(chain);

  try {
    return bcParser.getAssetSubType(assetId);
  } catch (error) {
    return '';
  }
}
