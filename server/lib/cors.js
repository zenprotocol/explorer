const cors = require('cors');
const config = require('../config/Config');
const logger = require('./logger');

const DEFAULT_ORIGIN = /zp\.io$/;
const SPECIAL_CHARS_REGEX = /[[\\^$.|?*+(){}]/g;

const corsOrigins = config.get('cors:origins');
const corsEnabled = config.toBoolean(config.get('cors:enabled'), true);

module.exports = {
  setup(app) {
    if (corsEnabled) {
      let origins = [];
      try {
        origins = (corsOrigins || '')
          .replace(SPECIAL_CHARS_REGEX, '\\$&')
          .split(' ')
          .map(str => new RegExp(str + '$'));
        // eslint-disable-next-line no-empty
      } catch (error) {}

      const origin = origins.length ? origins : DEFAULT_ORIGIN;
      logger.info(`setting up cors, origin=${origin}`);
      app.use(
        cors({
          origin
        })
      );
    } else {
      logger.info('allowing cors for all origins');
      // allow cors
      app.use(cors());
    }
  }
};
