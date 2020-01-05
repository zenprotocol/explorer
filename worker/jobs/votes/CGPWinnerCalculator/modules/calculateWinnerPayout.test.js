'use strict';

const test = require('tape');
const calculateWinnerPayout = require('./calculateWinnerPayout');

test('calculateWinnerPayout()', function(t) {
  function getTest({ voteResults, expected } = {}) {
    return wrapTest(`Given voteResults=${JSON.stringify(voteResults)}`, given => {
      const result = calculateWinnerPayout(voteResults);
      t.deepEqual(result, expected, `${given}: should return ${expected}`);
    });
  }

  // if there is a tie, no winner

  getTest({
    voteResults: [],
    expected: null,
  });

  getTest({
    voteResults: [
      { zpAmount: 11 },
    ],
    expected: { zpAmount: 11 },
  });

  getTest({
    voteResults: [
      { zpAmount: 11 },
      { zpAmount: 9 },
    ],
    expected: { zpAmount: 11 },
  });

  getTest({
    voteResults: [
      { zpAmount: 10 },
      { zpAmount: 10 },
    ],
    expected: null,
  });

  getTest({
    voteResults: [
      { zpAmount: 10 },
      { zpAmount: 100 },
      { zpAmount: 10 },
    ],
    expected: { zpAmount: 100 },
  });

  getTest({
    voteResults: [
      { zpAmount: 10 },
      { zpAmount: 1 },
      { zpAmount: 10 },
    ],
    expected: null,
  });

  t.end();
});

function wrapTest(given, test) {
  test(given);
}
