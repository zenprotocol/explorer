'use strict';
module.exports = (sequelize, DataTypes) => {
  const Activation = sequelize.define(
    'Activation',
    {
      contractId: DataTypes.STRING,
      txId: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    },
  );
  Activation.removeAttribute('id');
  return Activation;
};
