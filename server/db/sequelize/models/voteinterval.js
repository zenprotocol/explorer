'use strict';
module.exports = (sequelize, DataTypes) => {
  const VoteInterval = sequelize.define(
    'VoteInterval',
    {
      interval: DataTypes.INTEGER,
      phase: DataTypes.STRING,
      beginHeight: DataTypes.INTEGER,
      endHeight: DataTypes.INTEGER,
      thresholdZp: DataTypes.BIGINT,
      hasSnapshot: DataTypes.BOOLEAN
    },
    {
      timestamps: false
    }
  );
  VoteInterval.associate = function() {
    VoteInterval.belongsTo(VoteInterval, {
      as: 'PrevPhase',
      foreignKey: 'prevPhaseId'
    });
  };
  return VoteInterval;
};
