'use strict';
module.exports = (sequelize, DataTypes) => {
  var Transaction = sequelize.define(
    'Transaction',
    {
      version: DataTypes.INTEGER,
      hash: DataTypes.STRING,
    },
    {}
  );
  Transaction.associate = function(models) {
    Transaction.hasMany(models.Output);
    Transaction.hasMany(models.Input);
    Transaction.belongsTo(models.Block);
  };
  return Transaction;
};
