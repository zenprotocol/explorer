const axios = require('axios');
const request = axios.create({
  baseURL: (process.env.NODE_ENV === 'development')? 'http://localhost:3000' : ''
});

const Endpoints = {
  blocks: '/api/blocks',
  transactions: '/api/tx',
  addresses: '/api/address/',
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
    }
  },
  transactions: {
    async findByHash(hash) {
      return sendHttpRequest({
        url: `${Endpoints.transactions}/${hash}`,
        method: 'get',
      }).then(response => response.data);
    }
  },
  addresses: {
    async findTXs(address, asset) {
      const assetOrDefault = asset || '00';
      return sendHttpRequest({
        url: `${Endpoints.addresses}/${address}/${assetOrDefault}`,
        method: 'get',
      }).then(response => response.data);
    }
  }
};
