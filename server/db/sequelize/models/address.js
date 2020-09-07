'use strict';
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      sent: DataTypes.BIGINT,
      received: DataTypes.BIGINT,
      balance: DataTypes.BIGINT,
      txsCount: DataTypes.BIGINT,
    },
    {}
  );
  return Address;
};
