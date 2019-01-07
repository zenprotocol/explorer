'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContractActivation = sequelize.define(
    'ContractActivation',
    {
      ContractId: DataTypes.STRING,
      TransactionId: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    },
  );
  ContractActivation.removeAttribute('id');
  return ContractActivation;
};
