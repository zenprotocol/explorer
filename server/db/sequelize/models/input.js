'use strict';
module.exports = (sequelize, DataTypes) => {
  var Input = sequelize.define(
    'Input',
    {
      index: DataTypes.INTEGER,
      outpointTXHash: DataTypes.STRING,
      outpointIndex: DataTypes.INTEGER,
      value: DataTypes.INTEGER,
    },
    {}
  );
  Input.associate = function(models) {
    Input.belongsTo(models.Transaction);
    Input.hasOne(models.Output);
  };
  return Input;
};
