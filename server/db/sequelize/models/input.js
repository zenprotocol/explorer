'use strict';
module.exports = (sequelize, DataTypes) => {
  var Input = sequelize.define(
    'Input',
    {
      index: DataTypes.INTEGER,
      outpointTXHash: DataTypes.STRING,
      outpointIndex: DataTypes.INTEGER,
      isMint: DataTypes.BOOLEAN,
      asset: DataTypes.STRING,
      amount: DataTypes.BIGINT,
    },
    {}
  );
  Input.associate = function(models) {
    Input.belongsTo(models.Transaction);
    Input.belongsTo(models.Output);
  };
  return Input;
};
