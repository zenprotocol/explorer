'use strict';

const test = require('tape');
const calculateWinnerAllocation = require('./calculateWinnerAllocation');

test('calculateWinnerAllocation()', function(t) {
  function getTest({ voteResults, expected } = {}) {
    return wrapTest(`Given voteResults=${JSON.stringify(voteResults)}`, given => {
      const result = calculateWinnerAllocation(voteResults);
      t.equal(result, expected, `${given}: should return ${expected}`);
    });
  }

  getTest({
    voteResults: [],
    expected: null,
  });

  getTest({
    voteResults: [{ content: { allocation: 1 }, zpAmount: 11 }],
    expected: 1,
  });

  getTest({
    voteResults: [
      { content: { allocation: 1 }, zpAmount: 11 },
      { content: { allocation: 10 }, zpAmount: 9 },
    ],
    expected: 1,
  });

  getTest({
    voteResults: [
      { content: { allocation: 3 }, zpAmount: 10 },
      { content: { allocation: 10 }, zpAmount: 9 },
      { content: { allocation: 1 }, zpAmount: 10 },
    ],
    expected: 3,
  });

  getTest({
    voteResults: [
      { content: { allocation: 99 }, zpAmount: 89 },
      { content: { allocation: 98 }, zpAmount: 90 },
      { content: { allocation: 100 }, zpAmount: 10 },
    ],
    expected: 99,
  });

  getTest({
    voteResults: [
      { content: { allocation: 1 }, zpAmount: 10 },
      { content: { allocation: 10 }, zpAmount: 10 },
    ],
    expected: 5,
  });

  getTest({
    voteResults: [
      { content: { allocation: 1 }, zpAmount: 10 },
      { content: { allocation: 10 }, zpAmount: 1000 },
    ],
    expected: 10,
  });

  t.end();
});

function wrapTest(given, test) {
  test(given);
}
