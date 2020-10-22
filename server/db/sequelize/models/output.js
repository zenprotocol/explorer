'use strict';
module.exports = (sequelize, DataTypes) => {
  var Output = sequelize.define(
    'Output',
    {
      blockNumber: DataTypes.INTEGER,
      txId: DataTypes.BIGINT,
      index: DataTypes.INTEGER,
      lockType: DataTypes.STRING,
      lockValue: DataTypes.STRING,
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      amount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  Output.associate = function (models) {
    Output.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    Output.belongsTo(models.Tx, { foreignKey: 'txId' });
    Output.hasOne(models.Input, { foreignKey: 'outputId' });
  };
  return Output;
};
