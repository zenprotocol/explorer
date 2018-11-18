'use strict';
module.exports = (sequelize, DataTypes) => {
  const ZpAddressAmount = sequelize.define(
    'ZpAddressAmount',
    {
      address: DataTypes.STRING,
      balance: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  ZpAddressAmount.removeAttribute('id');
  return ZpAddressAmount;
};
