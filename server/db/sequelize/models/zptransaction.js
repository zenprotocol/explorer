'use strict';
module.exports = (sequelize, DataTypes) => {
  const ZpTransaction = sequelize.define(
    'ZpTransaction',
    {
      asset: DataTypes.STRING,
      outputSum: DataTypes.BIGINT,
      inputSum: DataTypes.BIGINT,
      totalSum: DataTypes.BIGINT,
      transactionId: DataTypes.BIGINT,
      hash: DataTypes.STRING,
      timestamp: DataTypes.BIGINT,
      blockNumber: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  ZpTransaction.removeAttribute('id');
  return ZpTransaction;
};
