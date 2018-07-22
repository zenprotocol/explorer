'use strict';
module.exports = (sequelize, DataTypes) => {
  var Address = sequelize.define(
    'Address',
    {
      address: DataTypes.STRING,
      addressBC: DataTypes.STRING,
    },
    {}
  );
  Address.associate = function(models) {
    Address.belongsToMany(models.Transaction, {through: 'AddressTransactions'});
  };
  return Address;
};
