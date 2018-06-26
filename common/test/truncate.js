const db = require('../../server/db/sequelize/models');

module.exports = async () => {
  return await Promise.all(
    Object.keys(db).map((key) => {
      if (['sequelize', 'Sequelize'].includes(key)) return null;
      return db[key].destroy({ where: {}, force: true });
    })
  );
};