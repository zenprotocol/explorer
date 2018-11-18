const ViewsRefresher = require('./ViewsRefresher');
const viewsRefresher = new ViewsRefresher();

module.exports = async function (job) {
  return await viewsRefresher.doJob(job);
};