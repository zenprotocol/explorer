'use strict';

const axios = require('axios');
const Config = require('../config/Config');
const NetworkError = require('./NetworkError');
const getChain = require('./getChain');
const request = axios.create({
  baseURL: Config.get('zp:node'),
  timeout: 30000,
});

const Endpoints = {
  blocks: {
    info: '/blockchain/info',
    block: '/blockchain/block?blockNumber=',
    blocks: '/blockchain/blocks',
  },
  contracts: {
    active: '/contract/active',
    executions: '/addressdb/contract/history',
  },
  oracle: 'http://oracle.zp.io',
};

let globalMute = false;

function sendHttpRequest(config) {
  if (globalMute) {
    return Promise.resolve({ data: {} });
  }
  return request.request(config).catch((error) => {
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
      }).then((response) => response.data);
    },
    async getBlock(blockNumber) {
      return sendHttpRequest({
        url: Endpoints.blocks.block + blockNumber,
        method: 'get',
      }).then((response) => response.data);
    },
    /**
     * Get a list of serialized blocks order DESC, from blockNumber
     */
    async getBlocks({ blockNumber, take } = {}) {
      return sendHttpRequest({
        url: Endpoints.blocks.blocks,
        method: 'get',
        params: { blockNumber, take },
      }).then((response) => response.data);
    },
  },
  contracts: {
    async getActiveContracts() {
      return sendHttpRequest({
        url: Endpoints.contracts.active,
        method: 'get',
      }).then((response) => response.data);
    },
    async getExecutions(data) {
      return sendHttpRequest({
        url: Endpoints.contracts.executions,
        method: 'post',
        data,
      }).then((response) => response.data);
    },
  },
  zen: {
    async getZenNodeLatestRelease() {
      return sendHttpRequest({
        url: 'https://api.github.com/repos/zenprotocol/zenprotocol/releases/latest',
        method: 'get',
      }).then((response) => {
        return response.data;
      });
    },
    async getDesktopWalletVersion() {
      return sendHttpRequest({
        url: 'https://zen-distributables.s3-eu-west-1.amazonaws.com/version.json',
        method: 'get',
      }).then((response) => {
        return response.data['wallet-version'];
      });
    },
  },
  wallet: {
    async broadcastTx(tx,url) {
      return sendHttpRequest({
        url: `${url}blockchain/publishtransaction`,
        method: 'post',
        data: {
          tx,
        },
      }).then((response) => {
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
      }).then((response) => response.data);
    },
    proof(ticker, date) {
      return sendHttpRequest({
        url: `${Endpoints.oracle}/proof`,
        method: 'get',
        params: {
          ticker,
          date,
        },
      }).then((response) => response.data);
    },
    timestamp(date) {
      return sendHttpRequest({
        url: `${Endpoints.oracle}/timestamp`,
        method: 'get',
        params: {
          date,
        },
      }).then((response) => response.data);
    },
  },
};
