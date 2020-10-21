'use strict';
module.exports = (sequelize, DataTypes) => {
  var TxsPerDay = sequelize.define(
    'TxsPerDay',
    {
      date: DataTypes.DATEONLY,
      value: DataTypes.INTEGER,
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: 'TxsPerDay',
    }
  );
  return TxsPerDay;
};
