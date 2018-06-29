module.exports = function({ pageSize = 0, page = 0, sorted = [], filtered = [] } = {}) {
  let query = {};
  if(sorted != [] && sorted != '[]') {
    query.order = sorted.map(item => {
      return [item.id, item.desc ? 'DESC' : 'ASC'];
    });
  }
  if (pageSize && pageSize > 0) {
    query.limit = pageSize;
    query.offset = page * pageSize;
  }

  return query;
};