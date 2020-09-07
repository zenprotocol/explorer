'use strict';

module.exports = (sequelize, DataTypes) => {
  var Block = sequelize.define(
    'Block',
    {
      blockNumber: { type: DataTypes.INTEGER, primaryKey: true },
      version: DataTypes.INTEGER,
      hash: DataTypes.STRING,
      parent: DataTypes.STRING,
      commitments: DataTypes.STRING,
      timestamp: DataTypes.BIGINT,
      difficulty: DataTypes.BIGINT,
      nonce1: DataTypes.BIGINT,
      nonce2: DataTypes.BIGINT,
      txsCount: DataTypes.BIGINT,
      reward: DataTypes.BIGINT,
      coinbaseAmount: DataTypes.BIGINT,
      allocationAmount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  Block.associate = function (models) {
    Block.hasMany(models.Tx, { foreignKey: 'blockNumber' });
    Block.hasMany(models.Input, { foreignKey: 'blockNumber' });
    Block.hasMany(models.Output, { foreignKey: 'blockNumber' });
    Block.hasMany(models.Execution, { foreignKey: 'blockNumber' });
    Block.hasMany(models.AddressTx, { foreignKey: 'blockNumber' });
    Block.hasMany(models.AssetTx, { foreignKey: 'blockNumber' });
    Block.hasMany(models.RepoVote, { foreignKey: 'blockNumber' });
    Block.hasMany(models.CgpVote, { foreignKey: 'blockNumber' });
  };
  return Block;
};
