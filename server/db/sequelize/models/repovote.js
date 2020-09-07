'use strict';
module.exports = (sequelize, DataTypes) => {
  const RepoVote = sequelize.define(
    'RepoVote',
    {
      executionId: DataTypes.BIGINT,
      blockNumber: DataTypes.INTEGER,
      txHash: DataTypes.STRING,
      commitId: DataTypes.STRING,
      address: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
  RepoVote.associate = function (models) {
    RepoVote.belongsTo(models.Block, { foreignKey: 'blockNumber' });
    RepoVote.belongsTo(models.Execution, { foreignKey: 'executionId'});
  };
  return RepoVote;
};
