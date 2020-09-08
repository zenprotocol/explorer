'use strict';

const bech32 = require('bech32');
const zen = require('@zen/zenjs');
const { ContractId } = require('@zen/zenjs/build/src/Consensus/Types/ContractId');

const LOCK_VALUE_KEY_OPTIONS = ['hash', 'pkHash', 'id', 'data'];

class BlockchainParser {
  constructor(chain = 'main') {
    this.setChain(chain);
  }

  setChain(chain) {
    this.chain = this.getChainBaseName(chain);
  }

  getChainBaseName(chain) {
    const append = 'net'; // remove this append text
    return chain.endsWith(append) ? chain.substring(0, chain.length - append.length).toLowerCase() : chain.toLowerCase();
  }

  getPublicKeyHashAddress(pkHash) {
    return zen.Address.getPublicKeyHashAddress(this.chain, pkHash);
  }

  getAddressFromPublicKey(publicKey) {
    return zen.PublicKey.fromString(publicKey).toAddress(this.chain);
  }

  getAddressFromContractId(contractId) {
    return this.getPublicKeyHashAddress(ContractId.fromString(contractId));
  }

  getContractVersion(contractId) {
    return ContractId.fromString(contractId).version;
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
        // lockValue should be one of LOCK_VALUE_KEY_OPTIONS
        lockValue = lockKeys.reduce(
          (value, key) => (LOCK_VALUE_KEY_OPTIONS.includes(key) ? lock[key] : value),
          null
        );
        address = lock.address || null;
        if (!address && lockValue) {
          try {
            // try to parse the address
            address = this.getPublicKeyHashAddress(lockValue);
          } catch (error) {
            address = null;
          }
        }
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
