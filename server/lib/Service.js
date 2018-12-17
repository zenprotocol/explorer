'use strict';

const axios = require('axios');
const Config = require('../config/Config');
const NetworkError = require('./NetworkError');
const request = axios.create({
  baseURL: Config.get('zp:node'),
});

const Endpoints = {
  blocks: {
    info: '/blockchain/info',
    block: '/blockchain/block?blockNumber=',
    blockReward: '/blockchain/blockreward?blockNumber=',
  },
  contracts: {
    active: '/contract/active',
    commands: '/addressdb/contract/history',
  },
  oracle: 'http://oracle.zp.io',
};

let globalMute = false;

function sendHttpRequest(config) {
  if (globalMute) {
    return Promise.resolve({ data: {} });
  }
  return request.request(config).catch(error => {
    throw new NetworkError(error, error.message, (error.response || {}).status);
  });
}

module.exports = {
  config: {
    mute(mute) {
      globalMute = mute;
    },
    isMuted() {
      return globalMute;
    },
    setBaseUrl(url) {
      request.defaults.baseURL = url;
    },
    setTimeout(timeout) {
      request.defaults.timeout = timeout;
    },
  },
  blocks: {
    async getChainInfo() {
      return sendHttpRequest({
        url: Endpoints.blocks.info,
        method: 'get',
      }).then(response => response.data);
    },
    async getBlock(blockNumber) {
      return sendHttpRequest({
        url: Endpoints.blocks.block + blockNumber,
        method: 'get',
      }).then(response => response.data);
    },
    async getBlockReward(blockNumber) {
      return sendHttpRequest({
        url: Endpoints.blocks.blockReward + blockNumber,
        method: 'get',
      }).then(response => response.data);
    },
  },
  contracts: {
    async getActiveContracts() {
      return sendHttpRequest({
        url: Endpoints.contracts.active,
        method: 'get',
      }).then(response => response.data);
    },
    async getCommands(data) {
      return sendHttpRequest({
        url: Endpoints.contracts.commands,
        method: 'post',
        data,
      }).then(response => response.data);
    },
  },
  zen: {
    async getZenNodeTags() {
      return sendHttpRequest({
        url: 'https://api.github.com/repos/zenprotocol/zenprotocol/tags',
        method: 'get',
      }).then(response => {
        return response.data;
      });
    },
    async getWalletLatestRelease() {
      return sendHttpRequest({
        url: 'https://api.github.com/repos/zenprotocol/zenwallet/releases/latest',
        method: 'get',
      }).then(response => {
        return response.data;
      });
    },
  },
  wallet: {
    async broadcastTx(tx) {
      return sendHttpRequest({
        url: 'https://remote-node.zp.io/api/publishtransaction',
        method: 'post',
        data: {
          tx,
        },
      }).then(response => {
        return response.data;
      });
    },
  },
  oracle: {
    data(ticker, date) {
      return sendHttpRequest({
        url: `${Endpoints.oracle}/data`,
        method: 'get',
        params: {
          ticker,
          date,
        },
      }).then(response => response.data);
    },
    proof(ticker, date) {
      return sendHttpRequest({
        url: `${Endpoints.oracle}/proof`,
        method: 'get',
        params: {
          ticker,
          date,
        },
      }).then(response => response.data);
    },
    timestamp(date) {
      return sendHttpRequest({
        url: `${Endpoints.oracle}/timestamp`,
        method: 'get',
        params: {
          date,
        },
      }).then(response => response.data);
    },
  },
};
