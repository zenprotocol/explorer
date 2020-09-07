'use strict';
module.exports = (sequelize, DataTypes) => {
  var Contract = sequelize.define(
    'Contract',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      version: DataTypes.INTEGER,
      code: DataTypes.TEXT,
      expiryBlock: DataTypes.INTEGER,
      txsCount: DataTypes.BIGINT,
      assetsIssued: DataTypes.BIGINT,
      lastActivationBlock: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  Contract.associate = function(models) {
    Contract.hasMany(models.Execution, { foreignKey: 'contractId'});
    Contract.belongsToMany(models.Tx, {
      as: 'ActivationTxs',
      through: 'Activation',
      foreignKey: 'contractId',
      otherKey: 'txId'
    });
  };
  return Contract;
};
