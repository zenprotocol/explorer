'use strict';
module.exports = (sequelize, DataTypes) => {
  const CGPInterval = sequelize.define(
    'CGPInterval',
    {
      interval: DataTypes.INTEGER,
      calculatedAtBlockId: DataTypes.INTEGER,
      winnerPayout: DataTypes.TEXT,
      winnerAllocation: DataTypes.TEXT,
    },
    {
      timestamps: false,
    }
  );
  CGPInterval.removeAttribute('id');
  CGPInterval.associate = function(models) {
    CGPInterval.belongsTo(models.Block, { foreignKey: 'calculatedAtBlockId' });
  };
  return CGPInterval;
};
