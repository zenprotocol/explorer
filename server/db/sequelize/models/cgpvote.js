'use strict';
module.exports = (sequelize, DataTypes) => {
  const CgpVote = sequelize.define(
    'CgpVote',
    {
      executionId: DataTypes.BIGINT,
      blockNumber: DataTypes.INTEGER,
      txHash: DataTypes.STRING,
      type: DataTypes.ENUM('nomination', 'allocation', 'payout'),
      ballot: DataTypes.TEXT,
      address: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
  CgpVote.associate = function (models) {
    CgpVote.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    CgpVote.belongsTo(models.Execution, { foreignKey: 'executionId'});
  };
  return CgpVote;
};
