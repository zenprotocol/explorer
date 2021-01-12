'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const executionsDAL = require('../../../../../server/components/api/executions/executionsDAL');

const testMissingParameters = require('./parts/missing-parameters');
const testMessageBody = require('./parts/message-body');
const testExecutions = require('./parts/executions');
const testVerifySignature = require('./parts/verifySignature');
const testVerifyAllocationBallot = require('./parts/verifyAllocationBallot');
const testVerifyPayoutBallot = require('./parts/verifyPayoutBallot');
const testDoubleVotes = require('./parts/double-votes');
const testSnapshotBalance = require('./parts/snapshot-balance');

test.onFinish(() => {
  executionsDAL.db.sequelize.close();
});

test('CgpVotesAdder.doJob() (DB)', async function(t) {
  await testMissingParameters({ t, before, after });
  await testMessageBody({ t, before, after });
  await testExecutions({ t, before, after });
  await testVerifySignature({ t, before: () => {}, after });
  await testVerifyAllocationBallot({ t, before, after });
  await testVerifyPayoutBallot({ t, before, after });
  await testDoubleVotes({ t, before, after });
  await testSnapshotBalance({ t, before, after });
});

function before(votesAdder) {
  td.replace(votesAdder, 'verifySignature');
  td.when(votesAdder.verifySignature(td.matchers.anything())).thenReturn(true);
}
function after() {
  td.reset();
}
