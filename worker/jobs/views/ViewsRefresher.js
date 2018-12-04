'use strict';

const logger = require('../../lib/logger')('views-refresh');
const addressAmountsDAL = require('../../../server/components/api/addressAmounts/addressAmountsDAL');
const zpTransactionsDAL = require('../../../server/components/api/zpTransactions/zpTransactionsDAL');
const assetOutstandingsDAL = require('../../../server/components/api/assetOutstandings/assetOutstandingsDAL');
const QueueError = require('../../lib/QueueError');

class ViewsRefresher {
  async doJob(job) {
    try {
      logger.info('Refreshing views');
      await addressAmountsDAL.refreshView();
      await zpTransactionsDAL.refreshView();
      await assetOutstandingsDAL.refreshView();
      logger.info('Refreshed all views');
      return 'Success';
    } catch (error) {
      logger.error(`An Error has occurred when refreshing views: ${error.message}`);
      throw new QueueError(error);
    }
  }
}

module.exports = ViewsRefresher;
