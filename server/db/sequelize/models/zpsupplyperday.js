'use strict';
module.exports = (sequelize, DataTypes) => {
  var ZpSupplyPerDay = sequelize.define(
    'ZpSupplyPerDay',
    {
      date: DataTypes.DATEONLY,
      value: DataTypes.DOUBLE,
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: 'ZpSupplyPerDay',
    }
  );
  return ZpSupplyPerDay;
};
