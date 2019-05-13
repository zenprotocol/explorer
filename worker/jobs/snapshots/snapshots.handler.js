const SnapshotsTaker = require('./SnapshotsTaker');
const snapshotsTaker = new SnapshotsTaker();

module.exports = async function (job) {
  return await snapshotsTaker.doJob(job);
};