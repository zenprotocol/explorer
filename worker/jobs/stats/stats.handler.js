const TxsPerDayCalc = require('./TxsPerDayCalc');
const ZpSupplyPerDayCalc = require('./ZpSupplyPerDayCalc');

module.exports = async function (job) {
  const txsPerDayCalc = new TxsPerDayCalc();
  const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();

  const [txsPerDayRows, zpSupplyPerDayRows] = await Promise.all([
    txsPerDayCalc.doJob(job),
    zpSupplyPerDayCalc.doJob(job),
  ]);
  return `TxsPerDay rows: ${txsPerDayRows}, ZpSupplyPerDay rows: ${zpSupplyPerDayRows}`;
};
