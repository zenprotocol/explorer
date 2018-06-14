'use strict';

const path = require('path');
const nconf = require('nconf');

function init() {
  nconf.argv().env('__'); // use __ for nested environment variables
  const environment = nconf.get('NODE_ENV') || 'development';
  // make sure NODE_ENV is not undefined
  process.env.NODE_ENV = environment;
  nconf.file(environment, path.join(__dirname, environment.toLowerCase() + '.json'));
  nconf.file('default', path.join(__dirname, 'default.json'));
}

const Config = {
  get: function(param) {
    return nconf.get(param);
  },
  any: function(keys) {
    return nconf.any(keys);
  },
};

init();

module.exports = Config;
