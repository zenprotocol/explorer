const TxsPerDayCalc = require('./TxsPerDayCalc');

module.exports = async function (job) {
  const txsPerDayCalc = new TxsPerDayCalc();
  const txsPerDayRows = await txsPerDayCalc.doJob(job);
  return `txs per day rows: ${txsPerDayRows}`;
};
