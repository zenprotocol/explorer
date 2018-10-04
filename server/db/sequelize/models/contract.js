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
      code: DataTypes.STRING,
      expiryBlock: DataTypes.INTEGER,
    },
    {}
  );
  return Contract;
};
