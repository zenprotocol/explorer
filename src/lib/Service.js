const axios = require('axios');
const request = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
});
const CancelToken = axios.CancelToken;

const Endpoints = {
  blocks: '/api/blocks',
  transactions: '/api/tx',
  addresses: '/api/addresses',
  info: '/api/infos',
  search: '/api/search',
  stats: '/api/stats',
  contracts: '/api/contracts',
};

let globalMute = false;

function sendHttpRequest(config) {
  if (globalMute) {
    return Promise.resolve({ data: {} });
  }
  return request
    .request(config)
    .then(response => response.data)
    .catch(error => {
      if (error.response) {
        const err = new Error(((error.response.data || {}).error || {}).message);
        err.status = error.response.status;
        err.data = error.response.data.error;
        throw err;
      } else if (axios.isCancel(error)) {
        throw error;
      } else {
        const err = new Error(error.message);
        err.status = -1;
        err.data = {};
        throw err;
      }
    });
}

function cancelableHttpRequest(config) {
  const source = CancelToken.source();
  const promise = sendHttpRequest(
    Object.assign({}, config, {
      cancelToken: source.token,
    })
  );
  promise.cancel = source.cancel;
  return promise;
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
  utils: {
    isCancel(error) {
      return axios.isCancel(error);
    },
  },
  infos: {
    async find() {
      return sendHttpRequest({
        url: `${Endpoints.info}`,
        method: 'get',
      });
    },
    async findByName(name) {
      return sendHttpRequest({
        url: `${Endpoints.info}/${name}`,
        method: 'get',
      });
    },
  },
  blocks: {
    async find(params) {
      return sendHttpRequest({
        url: Endpoints.blocks,
        method: 'get',
        params: params,
      });
    },
    async findById(id) {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/${id}`,
        method: 'get',
      });
    },
    async findTransactionsAssets(blockNumber, params) {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/${blockNumber}/assets`,
        method: 'get',
        params: params,
      });
    },
  },
  transactions: {
    async find(params) {
      return sendHttpRequest({
        url: Endpoints.transactions,
        method: 'get',
        params: params,
      });
    },
    async findByHash(hash) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${hash}`,
        method: 'get',
      });
    },
    async findAsset(id, asset) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${id}/${asset}`,
        method: 'get',
      });
    },
    broadcast(tx) {
      return cancelableHttpRequest({
        url: `${Endpoints.transactions}/broadcast`,
        method: 'post',
        data: {
          tx,
        },
      });
    },
    rawToTx(hex) {
      return cancelableHttpRequest({
        url: `${Endpoints.transactions}/raw`,
        method: 'post',
        data: {
          hex,
        },
      });
    },
  },
  addresses: {
    async findByAddress(address) {
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}`,
        method: 'get',
      });
    },
    async findTransactionsAssets(address, params) {
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}/assets`,
        method: 'get',
        params: params,
      });
    },
  },
  search: {
    async searchAll(search) {
      return sendHttpRequest({
        url: `${Endpoints.search}/${search}`,
        method: 'get',
      });
    },
  },
  stats: {
    charts(name) {
      return cancelableHttpRequest({
        url: `${Endpoints.stats}/charts/${name}`,
        method: 'get',
      });
    },
  },
  contracts: {
    findByAddress(address) {
      return cancelableHttpRequest({
        url: `${Endpoints.contracts}/${address}`,
        method: 'get',
      });
    },
  },
};
