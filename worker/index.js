'use strict';

/**
 * Currently worker is responsible for scheduling and work
 * if more jobs should be added, consider scheduling on a different file
 */

require('./blocksQueue');
require('./infosQueue');
require('./contractsQueue');
require('./commandsQueue');
require('./viewsRefreshQueue');
require('./snapshotsQueue');
require('./votesQueue');
require('./cgpWinnerQueue');