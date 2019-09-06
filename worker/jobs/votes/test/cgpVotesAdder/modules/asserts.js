'use strict';

const addsEmptyVoteAssert = ({ votes }) => votes.length === 1 && votes[0].ballot === null;

module.exports = { addsEmptyVoteAssert };
