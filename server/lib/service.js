'use strict';

const Config = require('../config/Config');
const axios = require('axios');
const request = axios.create({
  baseURL: Config.get('zp:node'),
});

const Endpoints = {
  blocks: {
    info: '/blockchain/info',
    block: 'blockchain/block?blockNumber=',
  },
};

module.exports = {
  blocks: {
    async getChainInfo() {
      return request.get(Endpoints.blocks.info).then(response => response.data);
    },
    async getBlock(blockNumber) {
      return request.get(Endpoints.blocks.block + blockNumber).then(response => response.data);
    },
  },
};
