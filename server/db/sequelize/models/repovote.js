'use strict';
module.exports = (sequelize, DataTypes) => {
  const RepoVote = sequelize.define(
    'RepoVote',
    {
      TransactionId: DataTypes.BIGINT,
      interval: DataTypes.INTEGER,
      commitId: DataTypes.STRING,
      address: DataTypes.STRING,
    },
    {}
  );
  RepoVote.associate = function(models) {
    RepoVote.belongsTo(models.Transaction);
  };
  return RepoVote;
};
