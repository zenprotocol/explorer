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
  nconf.file(
    environment,
    path.join(__dirname, environment.toLowerCase() + '.json')
  );
  nconf.file('default', path.join(__dirname, 'default.json'));
}

const Config = {
  get: function(param) {
    return nconf.get(param);
  },
  /**
   * Get any of the supplied keys by order
   *
   * @param {string[]} keys
   */
  any: function(keys) {
    return nconf.any(keys);
  },
  set: function(key, value) {
    nconf.set(key, value);
  },
  /**
   * Convert a env var to a boolean
   * @param {*} value
   * @param {boolean} defaultVal - the default value to return if nothing matches
   * @returns {boolean} true if the env var was a boolean true or the string "true", otherwise false
   */
  toBoolean: function(value, defaultVal = false) {
    return typeof value === 'boolean'
      ? value
      : value === 'true'
      ? true
      : value === 'false'
      ? false
      : defaultVal;
  }
};

init();

module.exports = Config;
