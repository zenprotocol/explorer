'use strict';

const bech32 = require('bech32');

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
    let address = null;
    if (output.lock && typeof output.lock !== 'object') {
      lockType = output.lock;
    } else if (output.lock && Object.keys(output.lock).length) {
      lockType = Object.keys(output.lock)[0];
      const lockTypeValues = Object.values(output.lock[lockType]);
      if (lockTypeValues.length) {
        if (lockTypeValues.length === 1) {
          address = Object.values(output.lock[lockType])[0];
        } else {
          const addressKeyOptions = ['hash', 'pkHash', 'id', 'data'];
          const lockTypeKeys = Object.keys(output.lock[lockType]);
          for (let i = 0; i < lockTypeKeys.length; i++) {
            const key = lockTypeKeys[i];
            if (addressKeyOptions.includes(key)) {
              address = output.lock[lockType][key];
              break;
            }
          }
        }
      }
    }

    return { lockType, address };
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