'use strict';

const tags = require('common-tags');
const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const infosDAL = require('../infos/infosDAL');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');
const addressesDAL = {};

addressesDAL.findOne = function(address) {
  return outputsDAL.findAll({
    where: {
      address,
    },
    limit: 1,
  }).then((results) => {
    return results.length ? results[0] : null;
  });
};

addressesDAL.addressExists = function(address) {
  return outputsDAL.findAll({
    where: {
      address,
    },
    limit: 1,
  }).then((results) => {
    return results.length > 0;
  });
};

addressesDAL.search = async function(search, limit = 10) {
  const Op = outputsDAL.db.sequelize.Op;
  const like = AddressUtils.isAddress(search) ? `${search}%` : `%${search}%`;
  const prefix = AddressUtils.getPrefix((await infosDAL.findByName('chain') || {}).value);
  const where = {
    address: {
      [Op.and]: {
        [Op.like]: like,
        [Op.notLike]: `c${prefix}%`,
      }
    },
  };
  return Promise.all([
    outputsDAL.count({
      where,
      distinct: true,
      col: 'address',
    }),
    outputsDAL.findAll({
      where,
      attributes: ['address'],
      group: 'address',
      limit,
    })
  ]);
};

addressesDAL.getSentSums = async function(address) {
  const db = inputsDAL.db;
  const Sequelize = db.Sequelize;
  return inputsDAL.findAll({
    attributes: ['Output.asset', [Sequelize.fn('sum', Sequelize.col('Output.amount')), 'total']],
    include: [
      {
        model: db.Output,
        where: {
          address,
        },
        attributes: [],
      },
    ],
    group: Sequelize.col('Output.asset'),
    raw: true,
  });
};
addressesDAL.getReceivedSums = async function(address) {
  const db = outputsDAL.db;
  const Sequelize = db.Sequelize;
  return outputsDAL.findAll({
    attributes: ['asset', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
    where: {
      address,
    },
    group: 'asset',
    raw: true,
  });
};

addressesDAL.getZpBalance = async function(address) {
  const db = outputsDAL.db;
  const sequelize = db.sequelize;
  const sql = tags.oneLine`
  select
  (output_sum - input_sum) / 100000000 as balance
  from
    (select
      coalesce(osums.address, isums.address) as address,
      osums.output_sum,
      case
      when isums.input_sum is null
      then 0
      else isums.input_sum
      end
    from
      (select
        o.address,
        sum(o.amount) as output_sum
      from "Outputs" o
      where o.asset = '00' AND o.address = :address
      group by address) as osums
      full outer join
      (select
        io.address,
        sum(io.amount) as input_sum
      from
        "Outputs" io
        join "Inputs" i
        on i."OutputId" = io.id
      where io.asset = '00' AND io.address = :address
      group by io.address) as isums
      on osums.address = isums.address) as bothsums
  where output_sum <> input_sum
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      address,
    },
  });
};

module.exports = addressesDAL;
