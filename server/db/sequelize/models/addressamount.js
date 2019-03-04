'use strict';
module.exports = (sequelize, DataTypes) => {
  const AddressAmount = sequelize.define(
    'AddressAmount',
    {
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      balance: DataTypes.BIGINT,
      received: DataTypes.BIGINT,
      sent: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  AddressAmount.removeAttribute('id');
  return AddressAmount;
};
