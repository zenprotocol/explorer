'use strict';

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, json } = format;
const Config = require('../config/Config');

const loggerInstances = {};

const createNamedLogger = function(name) {
  var logsDir = path.join(__dirname, `../../logs/${name}/`);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  const logger = createLogger({
    level: 'info',
    format: combine(label(), timestamp(), json()),
    transports: [
      new transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
    exitOnError: false,
  });

  if (process.env.NODE_ENV !== 'test' || Config.get('SHOW_CONSOLE_LOGS')) {
    logger.add(
      new transports.Console({
        format: combine(
          format.colorize(),
          format.timestamp(),
          format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
      })
    );
  }

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
