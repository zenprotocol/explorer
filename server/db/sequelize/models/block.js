'use strict';
module.exports = (sequelize, DataTypes) => {
  var Block = sequelize.define('Block', {
    version: DataTypes.INTEGER,
    parent: DataTypes.STRING,
    blockNumber: DataTypes.INTEGER,
    commitments: DataTypes.STRING,
    timestamp: DataTypes.INTEGER,
    difficulty: DataTypes.INTEGER,
    nonce1: DataTypes.INTEGER,
    nonce2: DataTypes.INTEGER
  }, {});
  Block.associate = function(models) {
    // associations can be defined here
  };
  return Block;
};