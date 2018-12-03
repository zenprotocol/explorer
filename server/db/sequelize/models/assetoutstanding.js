'use strict';
module.exports = (sequelize, DataTypes) => {
  var AssetOutstanding = sequelize.define(
    'AssetOutstanding',
    {
      asset: DataTypes.STRING,
      issued: DataTypes.BIGINT,
      destroyed: DataTypes.BIGINT,
      outstanding: DataTypes.BIGINT,
      keyholders: DataTypes.BIGINT,
      transactionsCount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  AssetOutstanding.removeAttribute('id');
  return AssetOutstanding;
};
