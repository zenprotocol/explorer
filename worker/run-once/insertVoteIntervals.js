/**
 * Insert intervals every fixed amount of blocks with options
 */
const cli = require('sywac');
const logger = require('../lib/logger')('vote-intervals');
const voteIntervalsDAL = require('../../server/components/api/repovote-intervals/repoVoteIntervalsDAL');
const db = require('../../server/db/sequelize/models');

const run = async () => {
  const argv = await cli
    .number('-b, --begin', { desc: 'The start block', required: true })
    .number('-l, --length', {
      desc: 'The interval length in blocks',
      required: true
    })
    .number('-g, --gap', {
      desc: 'The gap between intervals in blocks',
      required: true
    })
    .number('-a, --amount', {
      desc: 'The amount of intervals to insert',
      required: true
    })
    .number('-t, --threshold', {
      desc: 'The threshold in Kalapas for a valid candidate',
      required: true
    })
    .help('-h, --help')
    .showHelpByDefault()
    .parseAndExit();

  const { begin, length, gap, amount, threshold } = argv;
  const lastIntervalInDb = await voteIntervalsDAL.findOne({
    order: [['interval', 'DESC']]
  });
  const interval = lastIntervalInDb ? lastIntervalInDb.interval : 0;
  for (let i = 0; i < amount * 2; i++) {
    await voteIntervalsDAL.create({
      interval: interval + Math.floor(i / 2) + 1,
      phase: i % 2 === 0 ? 'Contestant' : 'Candidate',
      beginBlock: begin + i * (length + gap),
      endBlock: begin + i * (length + gap) + length,
      threshold: i % 2 === 0 ? threshold : null,
    });
  }
  logger.info('Finished inserting intervals');
};

run()
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    db.sequelize.close();
  });
