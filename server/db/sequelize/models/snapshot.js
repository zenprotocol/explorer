'use strict';
module.exports = (sequelize, DataTypes) => {
  const Snapshot = sequelize.define(
    'Snapshot',
    {
      blockNumber: DataTypes.INTEGER,
      address: DataTypes.STRING,
      amount: DataTypes.BIGINT,
    },
    {
      timestamps: false,
    }
  );
  Snapshot.removeAttribute('id');
  return Snapshot;
};
