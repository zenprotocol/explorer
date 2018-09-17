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
  },
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
          tx
        }
      }).then(response => {
        console.log(response);
        return response.data;
      });
    },
  },
};
