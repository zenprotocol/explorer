'use strict';
module.exports = (sequelize, DataTypes) => {
  var Asset = sequelize.define(
    'Asset',
    {
      asset: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      issued: DataTypes.BIGINT,
      destroyed: DataTypes.BIGINT,
      outstanding: DataTypes.BIGINT,
      keyholders: DataTypes.BIGINT,
      txsCount: DataTypes.BIGINT,
    },
    {}
  );
  return Asset;
};
