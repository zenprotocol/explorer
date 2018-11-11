const db = require('../../server/db/sequelize/models');

module.exports = async () => {
  // first remove blocks to make sure the order is right
  await db.Block.destroy({ where: {}, force: true });
  return await Promise.all(
    Object.keys(db).map((key) => {
      if (['sequelize', 'Sequelize'].includes(key)) return null;
      return db[key].destroy({ where: {}, force: true });
    })
  );
};