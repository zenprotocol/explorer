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
  assets: '/api/assets',
  oracle: '/api/oracle',
  contractTemplates: '/api/contractTemplates',
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
        params,
      });
    },
    async count() {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/count`,
        method: 'get',
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
        params,
      });
    },
  },
  transactions: {
    async find(params) {
      return sendHttpRequest({
        url: Endpoints.transactions,
        method: 'get',
        params,
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
        params,
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
    charts(name, params) {
      return cancelableHttpRequest({
        url: `${Endpoints.stats}/charts/${name}`,
        method: 'get',
        params,
      });
    },
  },
  contracts: {
    find(params) {
      return cancelableHttpRequest({
        url: `${Endpoints.contracts}`,
        method: 'get',
        params,
      });
    },
    findByAddress(address) {
      return cancelableHttpRequest({
        url: `${Endpoints.contracts}/${address}`,
        method: 'get',
      });
    },
    findAssetsOutstanding(address, params) {
      return cancelableHttpRequest({
        url: `${Endpoints.contracts}/${address}/assets`,
        method: 'get',
        params,
      });
    },
    findCommands(address, params) {
      return cancelableHttpRequest({
        url: `${Endpoints.contracts}/${address}/commands`,
        method: 'get',
        params,
      });
    },
  },
  assets: {
    find(params) {
      return cancelableHttpRequest({
        url: `${Endpoints.assets}`,
        method: 'get',
        params,
      });
    },
    findOne(hash) {
      return cancelableHttpRequest({
        url: `${Endpoints.assets}/${hash}`,
        method: 'get',
      });
    },
    findKeyholders(hash, params) {
      return cancelableHttpRequest({
        url: `${Endpoints.assets}/${hash}/keyholders`,
        method: 'get',
        params,
      });
    },
  },
  oracle: {
    data(ticker, date) {
      ticker = ticker || null;
      date = date || null;
      return cancelableHttpRequest({
        url: `${Endpoints.oracle}/data`,
        method: 'get',
        params: {
          ticker,
          date,
        },
      });
    },
    proof(ticker, date) {
      ticker = ticker || null;
      date = date || null;
      return cancelableHttpRequest({
        url: `${Endpoints.oracle}/proof`,
        method: 'get',
        params: {
          ticker,
          date,
        },
      });
    },
    latest() {
      return cancelableHttpRequest({
        url: `${Endpoints.oracle}/latest`,
        method: 'get',
      });
    },
  },
  contractTemplates: {
    findAll() {
      return cancelableHttpRequest({
        url: `${Endpoints.contractTemplates}`,
        method: 'get',
      });
    },
    findBySlug(slug) {
      return cancelableHttpRequest({
        url: `${Endpoints.contractTemplates}/${slug}`,
        method: 'get',
      });
    },
    download(data) {
      return cancelableHttpRequest({
        url: `${Endpoints.contractTemplates}/download`,
        method: 'post',
        data,
        responseType: 'blob',
      });
    },
  },
};
