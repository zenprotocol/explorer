'use strict';
module.exports = (sequelize, DataTypes) => {
  var Tx = sequelize.define(
    'Tx',
    {
      blockNumber: DataTypes.INTEGER,
      index: DataTypes.INTEGER,
      version: DataTypes.INTEGER,
      hash: DataTypes.STRING,
      inputCount: DataTypes.INTEGER,
      outputCount: DataTypes.INTEGER,
    },
    {
      timestamps: false,
      tableName: 'Txs',
    }
  );
  Tx.associate = function (models) {
    Tx.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    Tx.hasMany(models.Output, { foreignKey: 'txId' });
    Tx.hasMany(models.Input, { foreignKey: 'txId' });
    Tx.hasMany(models.Execution, { foreignKey: 'txId' });
    Tx.belongsToMany(models.Contract, {
      as: 'ActivationTxs',
      through: 'Activation',
      foreignKey: 'txId',
      otherKey: 'contractId',
    });
    Tx.hasMany(models.AddressTx, { foreignKey: 'txId' });
    Tx.hasMany(models.AssetTx, { foreignKey: 'txId' });
  };
  return Tx;
};
