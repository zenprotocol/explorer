'use strict';

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, json } = format;
const Config = require('../config/Config');

const loggerInstances = {};

const createNamedLogger = function(name) {
  const addedTransports = [];

  if(Config.get('NODE_ENV') !== 'production') {
    const logsDir = path.join(__dirname, `../../logs/${name}/`);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    addedTransports.push(new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }));
  }

  if (process.env.NODE_ENV !== 'test' || Config.get('SHOW_CONSOLE_LOGS')) {
    addedTransports.push(
      new transports.Console({
        format: combine(
          format.colorize(),
          format.timestamp(),
          format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
      })
    );
  }

  const logger = createLogger({
    level: 'info',
    format: combine(label(), timestamp(), json()),
    transports: addedTransports,
    exitOnError: false,
  });

  logger.stream = {
    write: function(message, encoding) {
      logger.info(message);
    },
  };

  return logger;
};

const getLogger = function(name) {
  if (!loggerInstances[name]) {
    loggerInstances[name] = createNamedLogger(name);
  }

  return loggerInstances[name];
};

module.exports = getLogger;
