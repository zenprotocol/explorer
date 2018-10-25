'use strict';
module.exports = (sequelize, DataTypes) => {
  var Contract = sequelize.define(
    'Contract',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      address: DataTypes.STRING,
      code: DataTypes.TEXT,
      expiryBlock: DataTypes.INTEGER,
    },
    {}
  );
  Contract.associate = function(models) {
    Contract.hasMany(models.Command);
  };
  return Contract;
};
