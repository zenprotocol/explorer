'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const commandsDAL = require('../../../../../server/components/api/commands/commandsDAL');

const testMissingParameters = require('./parts/missing-parameters');
const testMessageBody = require('./parts/message-body');
const testCommands = require('./parts/commands');

test.onFinish(() => {
  commandsDAL.db.sequelize.close();
});

test('CGPVotesAdder.doJob() (DB)', async function(t) {
  await testMissingParameters({ t, before, after });
  await testMessageBody({ t, before, after });
  await testCommands({ t, before, after });
});

function before(votesAdder) {
  td.replace(votesAdder, 'verify');
  td.when(votesAdder.verify(td.matchers.anything())).thenReturn(true);
}
function after() {
  td.reset();
}
