'use strict';
module.exports = (sequelize, DataTypes) => {
  var AssetTx = sequelize.define(
    'AssetTx',
    {
      blockNumber: DataTypes.INTEGER,
      txId: DataTypes.BIGINT,
      asset: DataTypes.STRING,
    },
    {
      timestamps: false,
      tableName: 'AssetTxs',
    }
  );
  AssetTx.removeAttribute('id');
  AssetTx.associate = function(models) {
    AssetTx.belongsTo(models.Tx, { foreignKey: 'txId'});
    AssetTx.belongsTo(models.Block, { foreignKey: 'blockNumber' });
  };
  return AssetTx;
};
