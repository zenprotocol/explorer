'use strict';
module.exports = (sequelize, DataTypes) => {
  const CGPVote = sequelize.define(
    'CGPVote',
    {
      CommandId: DataTypes.BIGINT,
      type: DataTypes.ENUM('allocation', 'payout', 'nomination'),
      ballot: DataTypes.TEXT,
      address: DataTypes.STRING,
    },
    {}
  );
  CGPVote.associate = function(models) {
    CGPVote.belongsTo(models.Command);
  };
  return CGPVote;
};
