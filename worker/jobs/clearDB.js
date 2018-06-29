'use strict';

const blocksDAL = require('../../server/components/api/blocks/blocksDAL');

blocksDAL.db[blocksDAL.model].destroy({where: {}}).then((affectedRows) => {
  console.log(`${affectedRows} were destroyed`);
}).catch((err) => {
  console.log(err);
}).finally(() => {
  blocksDAL.db.sequelize.close();
});
