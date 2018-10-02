'use strict';

const bech32 = require('bech32');

const LOCK_VALUE_KEY_OPTIONS = ['hash', 'pkHash', 'id', 'data'];

class BlockchainParser {
  getAddressFromBCAddress(addressBC) {
    let pkHash = Buffer.from(addressBC, 'hex');

    const words = bech32.toWords(pkHash);
    const wordsBuffer = Buffer.from(words);
    const withVersion = Buffer.alloc(words.length + 1);
    withVersion.writeInt8(0, 0);
    wordsBuffer.copy(withVersion, 1);

    const address = bech32.encode('zen', withVersion);
    return address;
  }

  getLockValuesFromOutput(output) {
    let lockType = null;
    let lockValue = null; // contains hash/id/pkHash
    let address = null;
    if (output.lock && typeof output.lock !== 'object') {
      // output lock is a primitive - just take it as it is
      lockType = output.lock;
    } else if (output.lock && Object.keys(output.lock).length) {
      lockType = Object.keys(output.lock)[0];
      const lock = output.lock[lockType];
      const lockKeys = Object.keys(lock);
      if (lockKeys.length) {
        address = lock.address || null; // some lock types contain the address
        // lockValue should be one of LOCK_VALUE_KEY_OPTIONS
        lockValue =
          lockKeys.reduce(key => {
            if (LOCK_VALUE_KEY_OPTIONS.includes(key)) {
              return lock[key];
            }
          }) || null;
      }
    }
    return { lockType, lockValue, address };
  }

  isMintInputValid(input) {
    const asset = input.mint.asset;
    const amount = input.mint.amount;
    return asset && typeof amount !== 'undefined' && amount !== null && !isNaN(Number(amount));
  }

  isOutpointInputValid(input) {
    const txHash = input.outpoint.txHash;
    const index = input.outpoint.index;
    return txHash && typeof index !== 'undefined' && index !== null && !isNaN(Number(index));
  }
}

module.exports = BlockchainParser;
