'use strict';
module.exports = (sequelize, DataTypes) => {
  var Info = sequelize.define(
    'Info',
    {
      name: DataTypes.STRING,
      value: DataTypes.STRING,
    },
    {}
  );
  return Info;
};
