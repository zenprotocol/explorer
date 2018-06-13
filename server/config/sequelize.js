'use strict';

const fs = require('fs');
const path = require('path');
const Config = require('./Config');

const developmentJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'development.json')));
const testJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'test.json')));

module.exports = {
  development: {
    username: developmentJson.db.username,
    password: developmentJson.db.password,
    database: developmentJson.db.database,
    host: developmentJson.db.host,
    dialect: developmentJson.db.dialect,
  },
  test: {
    username: testJson.db.username,
    password: testJson.db.password,
    database: testJson.db.database,
    host: testJson.db.host,
    dialect: testJson.db.dialect,
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: Config.get('db:dialect'),
  },
};
