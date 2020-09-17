'use strict';
module.exports = (sequelize, DataTypes) => {
  var DifficultyPerDay = sequelize.define(
    'DifficultyPerDay',
    {
      date: DataTypes.DATEONLY,
      value: DataTypes.DOUBLE,
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: 'DifficultyPerDay',
    }
  );
  return DifficultyPerDay;
};
