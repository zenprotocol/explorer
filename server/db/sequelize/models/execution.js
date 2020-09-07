'use strict';
module.exports = (sequelize, DataTypes) => {
  var Execution = sequelize.define(
    'Execution',
    {
      contractId: DataTypes.STRING,
      blockNumber: DataTypes.INTEGER,
      txId: DataTypes.BIGINT,
      command: DataTypes.TEXT,
      messageBody: DataTypes.TEXT,
      indexInTx: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  Execution.associate = function (models) {
    Execution.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    Execution.belongsTo(models.Tx, { foreignKey: 'txId' });
    Execution.belongsTo(models.Contract, { foreignKey: 'contractId' });
    Execution.hasMany(models.RepoVote, { foreignKey: 'executionId' });
    Execution.hasMany(models.CgpVote, { foreignKey: 'executionId' });
  };
  return Execution;
};
