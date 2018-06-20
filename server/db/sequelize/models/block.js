'use strict';
module.exports = (sequelize, DataTypes) => {
  var Block = sequelize.define('Block', {
    version: DataTypes.INTEGER,
    parent: DataTypes.STRING,
    blockNumber: DataTypes.INTEGER,
    commitments: DataTypes.STRING,
    timestamp: DataTypes.BIGINT,
    difficulty: DataTypes.BIGINT,
    nonce1: DataTypes.BIGINT,
    nonce2: DataTypes.BIGINT
  }, {});
  Block.associate = function(models) {
    // associations can be defined here
  };
  return Block;
};