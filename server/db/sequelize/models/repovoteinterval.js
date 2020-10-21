'use strict';
module.exports = (sequelize, DataTypes) => {
  const RepoVoteInterval = sequelize.define(
    'RepoVoteInterval',
    {
      interval: DataTypes.INTEGER,
      phase: DataTypes.STRING,
      beginBlock: DataTypes.INTEGER,
      endBlock: DataTypes.INTEGER,
      threshold: DataTypes.BIGINT,
      hasSnapshot: DataTypes.BOOLEAN,
    },
    {
      timestamps: false
    }
  );
  return RepoVoteInterval;
};
