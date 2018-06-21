'use strict';

const axios = require('axios');
const Config = require('../config/Config');
const NetworkError = require('../components/common/NetworkError');
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
  if(globalMute) {
    return Promise.resolve({data: {}});
  }

  return request.request(config).catch((error) => {
    throw new NetworkError(error);
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
};
