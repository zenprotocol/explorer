'use strict';

const Loadable = require('react-loadable');
const app = require('./app');
const config = require('./config/Config');
const getChain = require('./lib/getChain');
const logger = require('./lib/logger');

/**
 * Some modules need to know on which chain (test/main) we are
 */
const startPollForChain = () => {
  let chain = '';
  let counter = 0;
  let maxAttempts = 200;

  const pollForChain = async () => {
    logger.info('getting chain');
    chain = await getChain();
    if(!chain && counter < maxAttempts) {
      counter += 1;
      logger.info('chain does not exist yet, setting timeout');
      setTimeout(pollForChain, 300);
    }
    else {
      // chain is now saved in the getChain module
      logger.info(`got chain, chain = ${chain}`);
    }
  };
  pollForChain();
};

const start = () => {
  const port = config.any(['PORT', 'server:port']);
  Loadable.preloadAll().then(() => {
    app.listen(port, () => {
      startPollForChain();
      console.log(`Server running on port ${port}`);
    });
  });
};

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

module.exports = { app, start };
