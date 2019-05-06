'use strict';

import test from 'tape';
import { getVoteStatus, voteStatus } from './voteStatus';

test('voteStatus.getVoteStatus()', function(t) {
  wrapTest(
    'Given no intervals',
    given => {
      const actual = getVoteStatus({ currentBlock: 100 });
      t.equal(actual, voteStatus.none, `${given}: should return "none"`);
    },
    t
  );

  wrapTest(
    'Given next interval only',
    given => {
      const currentBlock = 1000;
      const nextInterval = { beginHeight: 2001, endHeight: 3000 };
      const actual = getVoteStatus({ currentBlock, nextInterval });
      t.equal(actual, voteStatus.before, `${given}: should return "before"`);
    },
    t
  );

  wrapTest(
    'Given current interval only',
    given => {
      const currentBlock = 2100;
      const currentInterval = { beginHeight: 2001, endHeight: 3000 };
      const actual = getVoteStatus({ currentBlock, currentInterval });
      t.equal(actual, voteStatus.during, `${given}: should return "during"`);
    },
    t
  );

  wrapTest(
    'Given current and next',
    given => {
      const currentBlock = 2100;
      const currentInterval = { beginHeight: 2001, endHeight: 3000 };
      const nextInterval = { beginHeight: 4001, endHeight: 5000 };
      const actual = getVoteStatus({ currentBlock, currentInterval, nextInterval });
      t.equal(actual, voteStatus.during, `${given}: should return "during"`);
    },
    t
  );

  wrapTest(
    'Given a past interval only',
    given => {
      const currentBlock = 2100;
      const currentInterval = { beginHeight: 1001, endHeight: 2000 };
      const actual = getVoteStatus({ currentBlock, currentInterval });
      t.equal(actual, voteStatus.after, `${given}: should return "after"`);
    },
    t
  );

  wrapTest(
    'Given a past interval and next',
    given => {
      const currentBlock = 2100;
      const currentInterval = { beginHeight: 1001, endHeight: 2000 };
      const nextInterval = { beginHeight: 4001, endHeight: 5000 };
      const actual = getVoteStatus({ currentBlock, currentInterval, nextInterval });
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
