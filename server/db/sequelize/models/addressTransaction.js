'use strict';
module.exports = (sequelize, DataTypes) => {
  var AddressTransaction = sequelize.define(
    'AddressTransaction',
    {
      type: DataTypes.ENUM('input', 'output'),
      asset: DataTypes.STRING,
    },
    {}
  );
  return AddressTransaction;
};
