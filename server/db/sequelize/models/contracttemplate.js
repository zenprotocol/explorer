'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContractTemplate = sequelize.define(
    'ContractTemplate',
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      template: DataTypes.TEXT,
    },
    {}
  );
  return ContractTemplate;
};
