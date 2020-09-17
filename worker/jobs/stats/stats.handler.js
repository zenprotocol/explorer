const TxsPerDayCalc = require('./TxsPerDayCalc');
const ZpSupplyPerDayCalc = require('./ZpSupplyPerDayCalc');
const DifficultyPerDayCalc = require('./DifficultyPerDayCalc');

module.exports = async function (job) {
  const txsPerDayCalc = new TxsPerDayCalc();
  const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
  const difficultyPerDayCalc = new DifficultyPerDayCalc();

  const [txsPerDayRows, zpSupplyPerDayRows, difficultyPerDayRows] = await Promise.all([
    txsPerDayCalc.doJob(job),
    zpSupplyPerDayCalc.doJob(job),
    difficultyPerDayCalc.doJob(job),
  ]);
  return `TxsPerDay rows: ${txsPerDayRows}, ZpSupplyPerDay rows: ${zpSupplyPerDayRows}, DifficultyPerDay rows: ${difficultyPerDayRows}`;
};
