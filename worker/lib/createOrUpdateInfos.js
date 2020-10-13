'use strict';

const infosDAL = require('../../server/components/api/infos/infosDAL');

module.exports = function createOrUpdateInfos(infos, { transaction } = {}) {
  const promises = [];
  infos.forEach((item) => {
    const { name, value } = item;
    promises.push(
      (async () => {
        const info = await infosDAL.findOne({ where: { name }, transaction });
        if (info) {
          await info.update(
            {
              name,
              value,
            },
            { transaction }
          );
        } else {
          await infosDAL.create(
            {
              name,
              value,
            },
            { transaction }
          );
        }
      })()
    );
  });

  return Promise.all(promises);
};
