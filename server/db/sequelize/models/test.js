'use strict';
module.exports = (sequelize, DataTypes) => {
  var Test = sequelize.define('Test', {
    title: DataTypes.STRING
  }, {});
  Test.associate = function(models) {
    // associations can be defined here
  };
  return Test;
};