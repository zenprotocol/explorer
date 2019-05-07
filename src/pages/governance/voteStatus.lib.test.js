'use strict';

import test from 'tape';
import { getVoteStatus, voteStatus } from './voteStatus';

test('voteStatus.getVoteStatus()', function(t) {
  wrapTest(
    'Given next interval',
    given => {
      const currentBlock = 1000;
      const actual = getVoteStatus({ currentBlock, beginHeight: 2001, endHeight: 3000 });
      t.equal(actual, voteStatus.before, `${given}: should return "before"`);
    },
    t
  );

  wrapTest(
    'Given current interval',
    given => {
      const currentBlock = 2100;
      const actual = getVoteStatus({ currentBlock, beginHeight: 2001, endHeight: 3000 });
      t.equal(actual, voteStatus.during, `${given}: should return "during"`);
    },
    t
  );

  wrapTest(
    'Given past interval',
    given => {
      const currentBlock = 2100;
      const actual = getVoteStatus({ currentBlock, beginHeight: 1000, endHeight: 2000 });
      t.equal(actual, voteStatus.after, `${given}: should return "after"`);
    },
    t
  );

  t.end();
});

// HELPERS ---
function wrapTest(given, test) {
  test(given);
}
