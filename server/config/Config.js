'use strict';

const path = require('path');
const dotenv = require('dotenv');
const nconf = require('nconf');

function loadEnvironmentVarsFromEnvFile() {
  // does not override vars that are already in the environment
  dotenv.config();
}

function init() {
  loadEnvironmentVarsFromEnvFile();
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
