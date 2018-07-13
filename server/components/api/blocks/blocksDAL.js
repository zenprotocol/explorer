'use strict';

const dal = require('../../../lib/dal');
const wrapORMErrors = require('../../../lib/wrapORMErrors');

const blocksDAL = dal.createDAL('Block');

blocksDAL.findAllCountTransactions = function (query) {
  const Sequelize = blocksDAL.db.Sequelize;
  query.attributes = {include: [[Sequelize.literal('(SELECT COUNT("Transactions"."id") FROM "Transactions" WHERE "Transactions"."BlockId" = "Block"."id")'), 'transactionsCount']]};
  return this.findAll(query);
};
blocksDAL.findAllCountTransactions = blocksDAL.findAllCountTransactions.bind(blocksDAL);

blocksDAL.findLatest = function (amount = 1) {
  return this.findAll({
    order: [
      ['createdAt', 'DESC']
    ],
    limit: amount
  });
};
blocksDAL.findLatest = blocksDAL.findLatest.bind(blocksDAL);

blocksDAL.findByBlockNumber = function (blockNumber) {
  return this.findOne({
    where: {
      blockNumber
    },
    include: [{
      model: this.db.Transaction,
      include: [
        'Outputs', 
        {
          model: this.db.Input,
          include: ['Output'],
        }
      ]
    }],
    
  });
};
blocksDAL.findLatest = blocksDAL.findLatest.bind(blocksDAL);

blocksDAL.addTransaction = async function(block, transaction) {
  return block.addTransaction(transaction);
};
blocksDAL.addTransaction = blocksDAL.addTransaction.bind(blocksDAL);

blocksDAL.updateByBlockNumber = async function (blockNumber, values = {}) {
  return new Promise((resolve, reject) => {
    this.db[this.model]
      .findOne({where: {blockNumber}})
      .then((model) => {
        return model.update(values, {individualHooks: true });
      })
      .then(resolve)
      .catch(error => {
        reject(wrapORMErrors(error));
      });
  });
},
module.exports = blocksDAL;