'use strict';

const fs = require('fs');
const path = require('path');
const winston = require('winston');
const Config = require('../../server/config/Config');

var logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)){
  fs.mkdirSync(logsDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log')})
  ]
});

if (process.env.NODE_ENV === 'development' || Config.get('SHOW_CONSOLE_LOGS')) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;