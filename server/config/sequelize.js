'use strict';

const fs = require('fs');
const path = require('path');
const Config = require('./Config');
const merge = require('deepmerge');

const developmentJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'development.json')));
const testJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'test.json')));

module.exports = {
  development: merge(developmentJson.db, {
    seederStorage: 'sequelize',
    logging: Config.get('db:logging') !== 'false' ? console.log : false,
  }),
  test: merge(testJson.db, {
    logging: Config.get('db:logging') !== 'false' ? console.log : false,
  }),
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: Config.get('db:dialect'),
    dialectOptions: Config.get('db:dialectOptions'),
    logging: false,
    seederStorage: 'sequelize',
  },
};
