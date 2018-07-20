// if this is ony for api calls, maybe rename to ApiService?

// why not import?
const axios = require('axios');
const request = axios.create({
  baseURL: (process.env.NODE_ENV === 'development')? 'http://localhost:3000' : ''
});

// why capital E?
const Endpoints = {
  blocks: '/api/blocks',
  transactions: '/api/tx',
  addresses: '/api/address/',
  info: '/api/infos',
};

let globalMute = false;

function sendHttpRequest(config) {
  if(globalMute) {
    return Promise.resolve({data: {}});
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
    findByName(name) {
      return sendHttpRequest({
        url: `${Endpoints.info}/${name}`,
        method: 'get',
      }).then(response => response.data);
    }
  },
  blocks: {
    find(params) {
      return sendHttpRequest({
        url: Endpoints.blocks,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
    findById(id) {
      return sendHttpRequest({
        url: `${Endpoints.blocks}/${id}`,
        method: 'get',
      }).then(response => response.data);
    }
  },
  transactions: {
    find(params) {
      return sendHttpRequest({
        url: Endpoints.transactions,
        method: 'get',
        params: params,
      }).then(response => response.data);
    },
    findByHash(hash) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${hash}`,
        method: 'get',
      }).then(response => response.data);
    }
  },
  addresses: {
    findByAddress(address) {
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}`,
        method: 'get',
      }).then(response => response.data);
    },
  }
};
