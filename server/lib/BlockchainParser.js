'use strict';

const { Address, PublicKey, ContractId, Block, Asset } = require('@zen/zenjs');

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
    return chain.endsWith(append)
      ? chain.substring(0, chain.length - append.length).toLowerCase()
      : chain.toLowerCase();
  }

  getPublicKeyHashAddress(pkHash) {
    return Address.getPublicKeyHashAddress(this.chain, pkHash);
  }

  getAddressFromPublicKey(publicKey) {
    return PublicKey.fromString(publicKey).toAddress(this.chain);
  }

  getAddressFromContractId(contractId) {
    return this.getPublicKeyHashAddress(ContractId.fromString(contractId));
  }

  getPkHashFromAddress(address) {
    return Address.decode(this.chain, address).hash;
  }

  isAddressValid(address) {
    try {
      Address.decode(this.chain, address);
      return true;
    } catch (error) {
      return false;
    }
  }

  getContractVersion(contractId) {
    return ContractId.fromString(contractId).version;
  }

  getAssetSubType(assetId) {
    return new Asset(assetId).getSubType();
  }

  deserializeBlock(serialized) {
    return Block.fromHex(serialized);
  }

  deserializeBlockToJson(serialized) {
    return Block.fromHex(serialized).toApiJson();
  }

  getLockValuesFromOutput(output) {
    let lockType = null;
    let lockKeyValue = { key: null, value: null }; // contains hash/id/pkHash
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
        lockKeyValue = lockKeys.reduce(
          (cur, key) => (LOCK_VALUE_KEY_OPTIONS.includes(key) ? { key, value: lock[key] } : cur),
          { key: null, value: null }
        );
        if (lockKeyValue.value) {
          try {
            // try to parse the address, make sure a contract address is parsed correctly
            address =
              lockKeyValue.key === 'id'
                ? this.getAddressFromContractId(lockKeyValue.value)
                : this.getPublicKeyHashAddress(lockKeyValue.value);
          } catch (error) {
            address = null;
          }
        }
      }
    }
    return { lockType, lockValue: lockKeyValue.value, address };
  }

  getRawLockValuesFromOutput(output) {
    let lockType = null;
    let lockKeyValue = { key: null, value: null }; // contains hash/id/pkHash
    let address = null;
    if (output.lock && typeof output.lock !== 'object') {
      // output lock is a primitive - just take it as it is
      lockType = output.lock;
    } else if (output.lock && Object.keys(output.lock).length) {
      lockType = output.lock.constructor.name;
      const lockKeys = Object.keys(output.lock);
      if (lockKeys.length) {
        // lockValue should be one of LOCK_VALUE_KEY_OPTIONS
        lockKeyValue = lockKeys.reduce(
          (cur, key) => (LOCK_VALUE_KEY_OPTIONS.includes(key) ? { key, value: output.lock[key] } : cur),
          { key: null, value: null }
        );
        if (lockKeyValue.value) {
          try {
            // try to parse the address, make sure a contract address is parsed correctly
            address =
              lockKeyValue.key === 'id'
                ? this.getAddressFromContractId(lockKeyValue.value)
                : this.getPublicKeyHashAddress(lockKeyValue.value);
          } catch (error) {
            address = null;
          }
        }
      }
    }
    return { lockType, lockValue: lockKeyValue.value, address };
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
