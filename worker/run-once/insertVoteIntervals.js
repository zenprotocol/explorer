/**
 * Insert intervals every fixed amount of blocks with options
 */
const cli = require('sywac');
const logger = require('../lib/logger')('vote-intervals');
const voteIntervalsDAL = require('../../server/components/api/voteIntervals/voteIntervalsDAL');
const db = require('../../server/db/sequelize/models');

const run = async () => {
  const argv = await cli
    .number('-b, --begin', { desc: 'The start block', required: true })
    .number('-l, --length', { desc: 'The interval length in blocks', required: true })
    .number('-g, --gap', { desc: 'The gap between snapshots in blocks', required: true })
    .number('-a, --amount', { desc: 'The amount of intervals to insert', required: true })
    .number('-i, --interval', { desc: 'The first interval number', defaultValue: 1 })
    .help('-h, --help')
    .showHelpByDefault()
    .parseAndExit();

  const { begin, length, gap, amount, interval } = argv;
  const intervals = [];
  for (let i = 0; i < amount; i++) {
    intervals.push({
      interval: interval + i,
      beginHeight: begin + i * gap,
      endHeight: begin + i * gap + length,
    });
  }
  await voteIntervalsDAL.bulkCreate(intervals);
  logger.info('Finished inserting intervals');
};

run()
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    db.sequelize.close();
  });
