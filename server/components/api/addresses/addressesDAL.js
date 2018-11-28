'use strict';

const tags = require('common-tags');
const outputsDAL = require('../outputs/outputsDAL');
const infosDAL = require('../infos/infosDAL');
const db = require('../../../db/sequelize/models');
const addressAmountsDAL = require('../addressAmounts/addressAmountsDAL');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');
const addressesDAL = {};

const sequelize = db.sequelize;
const Op = sequelize.Op;

addressesDAL.findOne = function(address) {
  return outputsDAL
    .findAll({
      where: {
        address,
      },
      limit: 1,
    })
    .then(results => {
      return results.length ? results[0] : null;
    });
};

addressesDAL.addressExists = function(address) {
  return outputsDAL
    .findAll({
      where: {
        address,
      },
      limit: 1,
    })
    .then(results => {
      return results.length > 0;
    });
};

addressesDAL.search = async function(search, limit = 10) {
  const like = AddressUtils.isAddress(search) ? `${search}%` : `%${search}%`;
  const prefix = AddressUtils.getPrefix(((await infosDAL.findByName('chain')) || {}).value);
  const where = {
    address: {
      [Op.and]: {
        [Op.like]: like,
        [Op.notLike]: `c${prefix}%`,
      },
    },
  };
  return Promise.all([
    addressAmountsDAL.count({
      where,
      distinct: true,
      col: 'address',
    }),
    addressAmountsDAL.findAll({
      where,
      attributes: ['address'],
      group: 'address',
      limit,
    }),
  ]);
};

addressesDAL.getAssetAmounts = function(address) {
  return addressAmountsDAL
    .findAll({
      where: {
        address,
      },
    })
    .then(result => {
      return result.length > 0
        ? result
        : [
            {
              address,
              asset: '00',
              balance: '0',
              received: '0',
              sent: '0',
            },
          ];
    });
};

addressesDAL.getZpBalance = async function(address) {
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
