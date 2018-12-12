'use strict';

const infosDAL = require('./infosDAL');
const transactionsDAL = require('../transactions/transactionsDAL');

module.exports = {
  findAll: async function() {
    const [allItems, transactionsCount] = await Promise.all([
      infosDAL.findAll({ attributes: ['name', 'value'] }),
      transactionsDAL.count(),
    ]);

    const items = allItems.reduce((all, cur) => {
      all[cur.name] = cur.value;
      return all;
    }, {});

    items.transactions = transactionsCount;

    return items;
  },
  findByName: async function({name} = {}) {
    return await infosDAL.findByName(name);
  },
};
