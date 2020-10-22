'use strict';
module.exports = (sequelize, DataTypes) => {
  var Input = sequelize.define(
    'Input',
    {
      blockNumber: DataTypes.INTEGER,
      txId: DataTypes.BIGINT,
      outputId: DataTypes.BIGINT,
      index: DataTypes.INTEGER,
      outpointTxHash: DataTypes.STRING,
      outpointIndex: DataTypes.INTEGER,
      isMint: DataTypes.BOOLEAN,
      lockType: DataTypes.STRING,
      address: DataTypes.STRING,
      asset: DataTypes.STRING,
      amount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  Input.associate = function(models) {
    Input.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    Input.belongsTo(models.Tx, { foreignKey: 'txId' });
    Input.belongsTo(models.Output, { foreignKey: 'outputId' });
  };
  return Input;
};
