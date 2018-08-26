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
  Info.associate = function(models) {
    // associations can be defined here
  };
  return Info;
};
