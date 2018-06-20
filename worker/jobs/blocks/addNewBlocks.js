'use strict';

const service = require('../../../server/lib/service');
const blocksDAL = require('../../../server/components/blocks/blocksDAL');
const Config = require('../../../server/config/Config');

async function getLatestBlockNumberFromNode() {
  const info = await service.blocks.getChainInfo();
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

module.exports = async function() {
  let numberOfBlocksAdded = 0;
  let latestBlockNumberInDB = await getLatestBlockNumberInDB();
  const latestBlockNumberInNode = await getLatestBlockNumberFromNode();
  
  if (latestBlockNumberInNode > latestBlockNumberInDB) {
    // add the block synced to have the right incrementing ids
    for (let blockNumber = latestBlockNumberInDB + 1; blockNumber <= latestBlockNumberInNode; blockNumber++) {
      const newBlock = await service.blocks.getBlock(blockNumber);

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
      numberOfBlocksAdded++;
    }
  }

  return numberOfBlocksAdded;
};
