'use strict';

const dal = require('../../../lib/dal');

const snapshotsDAL = dal.createDAL('Snapshot');

module.exports = snapshotsDAL;
