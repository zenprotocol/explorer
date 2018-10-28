'use strict';

require('./config/Config');
// pre processing for react ssr
require('./babel');

const server = require('./server');
server.start();
