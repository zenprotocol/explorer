'use strict';

const votesDAL = require('./votesDAL');

module.exports = {
  findCurrentOrNext: async function() {
    return {
      title: 'VOTE ON THE AUTHORIZED PROTOCOL',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      startBlock: 9500,
      endBlock: 10000,
      votes: [
        {
          address: 'zen1q03jc77dtd2x2gk90f40p9ezv5pf3e2wm5hy8me2xuxzmjneachrq6g05w5',
          score: 1000,
        },
        {
          address: 'zen1qjllcrp3u24derxfx9w5s7h5h0c2ggwqfs3p3x6t75xe8fqulh95skq746g',
          score: 900,
        },
        {
          address: 'zen1q05xwuujk79l30qdgydp95d0dpqaqqe6scpx3q2xz5d9e2c4xj0nqntug7z',
          score: 900,
        },
        {
          address: 'zen1qqe3ytnf6572c3tvmnudejavf0rjelcj7uvcwncevav3gt4a44pvsldr876',
          score: 400,
        },
        {
          address: 'zen1qa9ttmrt43l9h5h7fdllk3lx5j090yc7lm42226nt63f4jd2rksnqa4s0gv',
          score: 200,
        },
      ],
    };
  },
};
