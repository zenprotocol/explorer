'use strict';
module.exports = (sequelize, DataTypes) => {
  var AssetOutstanding = sequelize.define(
    'AssetOutstanding',
    {
      asset: DataTypes.STRING,
      issued: DataTypes.BIGINT,
      destroyed: DataTypes.BIGINT,
      outstanding: DataTypes.BIGINT,
      keyholders: DataTypes.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  AssetOutstanding.removeAttribute('id');
  return AssetOutstanding;
};
