'use strict';

const fs = require('fs');
const path = require('path');
const Config = require('./Config');
const merge = require('deepmerge');
const Sequelize = require('sequelize');

const developmentJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'development.json')));
const testJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'test.json')));

module.exports = {
  development: merge(developmentJson.db, { operatorsAliases: Sequelize.Op }),
  test: {
    username: testJson.db.username,
    password: testJson.db.password,
    database: testJson.db.database,
    host: testJson.db.host,
    dialect: testJson.db.dialect,
    operatorsAliases: Sequelize.Op,
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: Config.get('db:dialect'),
    dialectOptions: Config.get('db:dialectOptions'),
    operatorsAliases: Sequelize.Op,
    logging: false,
  },
};
