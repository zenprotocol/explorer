'use strict';
module.exports = (sequelize, DataTypes) => {
  const RepoVoteInterval = sequelize.define(
    'RepoVoteInterval',
    {
      interval: DataTypes.INTEGER,
      phase: DataTypes.STRING,
      beginBlock: DataTypes.INTEGER,
      endBlock: DataTypes.INTEGER,
      thresholdZp: DataTypes.BIGINT,
      hasSnapshot: DataTypes.BOOLEAN,
      prevPhaseId: DataTypes.INTEGER,
    },
    {
      timestamps: false
    }
  );
  RepoVoteInterval.associate = function() {
    RepoVoteInterval.belongsTo(RepoVoteInterval, {
      as: 'PrevPhase',
      foreignKey: 'prevPhaseId'
    });
  };
  return RepoVoteInterval;
};
