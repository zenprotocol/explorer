'use strict';
module.exports = (sequelize, DataTypes) => {
  var Command = sequelize.define(
    'Command',
    {
      command: DataTypes.STRING,
      messageBody: DataTypes.TEXT,
      TransactionId: DataTypes.BIGINT,
      indexInTransaction: DataTypes.INTEGER,
      ContractId: DataTypes.STRING,
    },
    {}
  );
  Command.associate = function(models) {
    Command.belongsTo(models.Transaction);
    Command.belongsTo(models.Contract);
  };
  return Command;
};
