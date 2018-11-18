'use strict';

const logger = require('../../lib/logger')('views-refresh');
const zpAddressAmountsDAL = require('../../../server/components/api/zpAddressAmounts/zpAddressAmountsDAL');
const zpTransactionsDAL = require('../../../server/components/api/zpTransactions/zpTransactionsDAL');

class ViewsRefresher {
  async doJob(job) {
    try {
      logger.info('Refreshing views');
      await zpAddressAmountsDAL.refreshView();
      await zpTransactionsDAL.refreshView();
      logger.info('Refreshed all views');
      return 'Success';
    } catch (error) {
      logger.error(`An Error has occurred when refreshing views: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ViewsRefresher;
