'use strict';
module.exports = (sequelize, DataTypes) => {
  var AddressTx = sequelize.define(
    'AddressTx',
    {
      blockNumber: DataTypes.INTEGER,
      txId: DataTypes.BIGINT,
      address: DataTypes.STRING,
    },
    {
      timestamps: false,
      tableName: 'AddressTxs',
    }
  );
  AddressTx.removeAttribute('id');
  AddressTx.associate = function (models) {
    AddressTx.belongsTo(models.Tx, { foreignKey: 'txId'});
    AddressTx.belongsTo(models.Block, { foreignKey: 'blockNumber' });
  };
  return AddressTx;
};
