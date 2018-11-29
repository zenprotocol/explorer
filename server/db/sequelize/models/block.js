'use strict';
module.exports = (sequelize, DataTypes) => {
  var Block = sequelize.define('Block', {
    version: DataTypes.INTEGER,
    hash: DataTypes.STRING,
    parent: DataTypes.STRING,
    blockNumber: DataTypes.INTEGER,
    commitments: DataTypes.STRING,
    timestamp: DataTypes.BIGINT,
    difficulty: DataTypes.BIGINT,
    nonce1: DataTypes.BIGINT,
    nonce2: DataTypes.BIGINT,
    transactionCount: DataTypes.BIGINT,
    reward: DataTypes.BIGINT,
  }, {});
  Block.associate = function(models) {
    Block.hasMany(models.Transaction);
  };
  return Block;
};