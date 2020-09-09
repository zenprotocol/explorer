'use strict';
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      inputSum: DataTypes.BIGINT,
      outputSum: DataTypes.BIGINT,
      balance: DataTypes.BIGINT,
      txsCount: DataTypes.BIGINT,
    },
    {}
  );
  return Address;
};
