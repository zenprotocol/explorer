'use strict';

/**
 * Currently worker is responsible for scheduling and work
 * if more jobs should be added, consider scheduling on a different file
 */

require('./blocksQueue');
require('./reorgsQueue');
require('./infosQueue');
require('./contractsQueue');
require('./commandsQueue');