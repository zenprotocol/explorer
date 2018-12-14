'use strict';
module.exports = (sequelize, DataTypes) => {
  const AddressAmount = sequelize.define(
    'AddressAmount',
    {
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      balance: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  AddressAmount.removeAttribute('id');
  return AddressAmount;
};
