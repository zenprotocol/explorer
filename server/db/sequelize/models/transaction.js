'use strict';
module.exports = (sequelize, DataTypes) => {
  var Transaction = sequelize.define(
    'Transaction',
    {
      version: DataTypes.INTEGER,
      hash: DataTypes.STRING,
      index: DataTypes.INTEGER,
      inputCount: DataTypes.INTEGER,
      outputCount: DataTypes.INTEGER,
    },
    {}
  );
  Transaction.associate = function(models) {
    Transaction.hasMany(models.Output);
    Transaction.hasMany(models.Input);
    Transaction.belongsTo(models.Block);
    Transaction.belongsToMany(models.Address, {through: models.AddressTransaction});
  };
  return Transaction;
};
