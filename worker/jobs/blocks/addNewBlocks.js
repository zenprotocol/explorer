'use strict';

const Service = require('../../../server/lib/Service');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const logger = require('../../lib/logger');

async function getLatestBlockNumberFromNode() {
  const info = await Service.blocks.getChainInfo();
  return info.blocks;
}

async function getLatestBlockNumberInDB() {
  let blockNumber = 0;
  const latestBlocksInDB = await blocksDAL.findLatest();
  if(latestBlocksInDB.length) {
    const latestBlockInDB = latestBlocksInDB[0];
    blockNumber = latestBlockInDB.blockNumber;
  }
  return blockNumber;
}

module.exports = async function addNewBlocks() {
  let numberOfBlocksAdded = 0;
  let latestBlockNumberInDB = await getLatestBlockNumberInDB();
  const latestBlockNumberInNode = await getLatestBlockNumberFromNode();

  logger.info('Block numbers:\n', {
    latestBlockNumberInDB,
    latestBlockNumberInNode,
    needsUpdate: latestBlockNumberInNode > latestBlockNumberInDB
  });
  
  if (latestBlockNumberInNode > latestBlockNumberInDB) {
    // add the block synced to have the right incrementing ids
    for (let blockNumber = latestBlockNumberInDB + 1; blockNumber <= latestBlockNumberInNode; blockNumber++) {
      logger.info(`Getting block #${blockNumber} from NODE...`);
      const newBlock = await Service.blocks.getBlock(blockNumber);
      logger.info(`Got block #${newBlock.header.blockNumber} from NODE...`);

      try {
        logger.info(`Creating a new block with blockNumber ${newBlock.header.blockNumber}  ...`);
        await blocksDAL.create({
          version: newBlock.header.version,
          parent: newBlock.header.parent,
          blockNumber: newBlock.header.blockNumber,
          commitments: newBlock.header.commitments,
          timestamp: newBlock.header.timestamp,
          difficulty: newBlock.header.difficulty,
          nonce1: newBlock.header.nonce[0],
          nonce2: newBlock.header.nonce[1],
        });
        logger.info(`Block #${newBlock.header.blockNumber} created.`);
      } catch (error) {
        logger.error(`Error creating #${newBlock.header.blockNumber}`, error);
        // do not skip a block
        break;
      }
      numberOfBlocksAdded++;
    }
  }

  return numberOfBlocksAdded;
};
