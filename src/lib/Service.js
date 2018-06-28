const axios = require('axios');
const request = axios.create({
  baseURL: (process.env.NODE_ENV === 'development')? 'http://localhost:3000' : ''
});

const Endpoints = {
  blocks: '/api/blocks',
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
  },
};
