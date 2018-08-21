const axios = require('axios');
const request = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
});

const Endpoints = {
  blocks: '/api/blocks',
  transactions: '/api/tx',
  addresses: '/api/addresses',
  info: '/api/infos',
};

let globalMute = false;

function sendHttpRequest(config) {
  if (globalMute) {
    return Promise.resolve({ data: {} });
  }
  return request.request(config);
}

export default {
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
  infos: {
    async findByName(name) {
      return sendHttpRequest({
        url: `${Endpoints.info}/${name}`,
        method: 'get',
      }).then(response => response.data);
    },
  },
  blocks: {
    async find(params) {
      return sendHttpRequest({
        url: Endpoints.blocks,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
    async findById(id) {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/${id}`,
        method: 'get',
      }).then(response => response.data);
    },
    async findTransactionsAssets(blockNumber, params) {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/${blockNumber}/assets`,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
  },
  transactions: {
    async find(params) {
      return sendHttpRequest({
        url: Endpoints.transactions,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
    async findByHash(hash) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${hash}`,
        method: 'get',
      }).then(response => response.data);
    },
    async findAsset(id, asset) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${id}/${asset}`,
        method: 'get',
      }).then(response => response.data);
    },
  },
  addresses: {
    async findByAddress(address) {
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}`,
        method: 'get',
      }).then(response => response.data);
    },
    async findTransactionsAssets(address, params) {
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}/assets`,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
  },
};
