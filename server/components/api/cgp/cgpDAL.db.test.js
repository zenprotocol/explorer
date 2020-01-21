'use strict';

const test = require('blue-tape');
const { Address } = require('@zen/zenjs');
const { ContractId } = require('@zen/zenjs/build/src/Consensus/Types/ContractId');
const truncate = require('../../../../test/lib/truncate');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksDAL = require('../blocks/blocksDAL');
const outputsDAL = require('../outputs/outputsDAL');
const contractsDAL = require('../contracts/contractsDAL');
const commandsDAL = require('../commands/commandsDAL');
const cgpDAL = require('./cgpDAL');
const SnapshotsTaker = require('../../../../worker/jobs/snapshots/SnapshotsTaker');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');
const faker = require('faker');

const CONTRACT_ID = '00000000abbf8805a203197e4ad548e4eaa2b16f683c013e31d316f387ecf7adc65b3fb2';
const TALLY_BLOCK = 100;
const ADDRESS_AMOUNTS = {
  tzn11: 10000000000,
  tzn12: 10100000000,
  tzn13: 10200000000,
};

test('cgpDAL.findLastValidVoteBlockNumber() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();

    const result = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: 100, intervalLength: 100, interval1Snapshot: 90, interval1Tally: 100, type: 'allocation'
    });
    t.equal(result, 0, `${given}: should return zero`);
  });

  await wrapTest('Given votes, current interval = 2', async given => {
    await createDemoData({toBlock: 101});

    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0105' });

    const result = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: 101, intervalLength: 100, interval1Snapshot: 90, interval1Tally: 100, type: 'allocation'
    });
    t.equal(result, 91, `${given}: should return the highest block with a vote`);
  });

  await wrapTest('Given votes in first interval, current interval = 4', async given => {
    await createDemoData({toBlock: 301});

    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0105' });

    // start block is 200, we want to find the first vote starting at prev interval
    const result = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: 200, intervalLength: 100, interval1Snapshot: 90, interval1Tally: 100, type: 'allocation'
    });
    t.equal(result, 91, `${given}: should return the highest block with a vote`);
  });

  await wrapTest('Given votes in intervals 1 and 3, current interval = 4, searching for interval 3', async given => {
    await createDemoData({toBlock: 301});

    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0105' });
    await addVoteForAllAddresses({ blockNumber: 291, type: 'allocation', ballot: '0105' });

    // for calculating the winner of interval 3, to find the prev allocation winner 
    const result = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: 200, intervalLength: 100, interval1Snapshot: 90, interval1Tally: 100, type: 'allocation'
    });
    t.equal(result, 91, `${given}: should return the highest block with a vote`);
  });

  await wrapTest('Given votes in intervals 1 and 3, current interval = 6, searching for interval 5', async given => {
    await createDemoData({toBlock: 601});

    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0105' });
    await addVoteForAllAddresses({ blockNumber: 291, type: 'allocation', ballot: '0105' });

    // for calculating the winner of interval 5
    const result = await cgpDAL.findLastValidVoteBlockNumber({
      startBlockNumber: 400, intervalLength: 100, interval1Snapshot: 90, interval1Tally: 100, type: 'allocation'
    });
    t.equal(result, 291, `${given}: should return the highest block with a vote`);
  });
});

test('cgpDAL.findAllVotesInInterval() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();

    const allocationVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    const payoutVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.assert(allocationVotes.length === 0 && payoutVotes.length === 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given 1 allocation vote per address', async given => {
    await createDemoData();

    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '123456789' });

    const allocationVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    const payoutVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(allocationVotes.length, 3, `${given}: should return 3 allocation votes`);
    t.equal(payoutVotes.length, 0, `${given}: should return 0 payout votes`);
  });

  await wrapTest('Given 1 payout vote per address', async given => {
    await createDemoData();

    await addVoteForAllAddresses({ blockNumber: 91, type: 'payout', ballot: '123456789' });

    const allocationVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    const payoutVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(allocationVotes.length, 0, `${given}: should return 0 allocation votes`);
    t.equal(payoutVotes.length, 3, `${given}: should return 3 payout votes`);
  });

  await wrapTest('Given same address votes for payout and allocation in different blocks', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 92, type: 'payout', ballot: '2' });

    const allocationVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    const payoutVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.assert(
      allocationVotes.length === 1 && allocationVotes[0].ballot === '1',
      `${given}: should return the allocation vote`
    );
    t.assert(payoutVotes.length === 1 && payoutVotes[0].ballot === '2', `${given}: should return the payout vote`);
  });

  await wrapTest('Given a double vote', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 92, type: 'payout', ballot: '2' });

    const votes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 3, `${given}: should return 3 votes`);
    const hasSecondCommit = votes.some(item => item.ballot === '2');
    t.equal(hasSecondCommit, false, `${given}: should return the first vote`);
  });

  await wrapTest('Given a double vote in the same block', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 91, txIndex: 1, type: 'payout', ballot: '2' });

    const votes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 3, `${given}: should return 3 votes`);
    const hasSecondCommit = votes.some(item => item.ballot === '2');
    t.equal(hasSecondCommit, false, `${given}: should return the first vote`);
  });

  await wrapTest('Given a double allocation vote and extra payout vote from same address', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 92, type: 'payout', ballot: '2' });
    // the double vote
    await addVote({ address: 'tzn11', blockNumber: 95, type: 'allocation', ballot: '3' });

    const allocationVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    const payoutVotes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.assert(
      allocationVotes.length === 1 && allocationVotes[0].ballot === '1',
      `${given}: should return the right allocation vote`
    );
    t.assert(payoutVotes.length === 1 && payoutVotes[0].ballot === '2', `${given}: should return the payout vote`);
  });

  await wrapTest('Given a vote before the snapshot', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 89, type: 'payout', ballot: '1' });
    const votes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 0, `${given}: should not return the vote`);
  });

  await wrapTest('Given a vote at the snapshot', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 90, type: 'payout', ballot: '1' });
    const votes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 0, `${given}: should not return the vote`);
  });

  await wrapTest('Given a vote at the tally block', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 100, type: 'allocation', ballot: '1' });
    const votes = await cgpDAL.findAllVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 3, `${given}: should return the vote`);
  });
});

test('cgpDAL.countVotesInInterval() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();

    const allocationVotes = await cgpDAL.countVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
    });
    const payoutVotes = await cgpDAL.countVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
    });
    t.assert(allocationVotes === 0 && payoutVotes === 0, `${given}: should return 0`);
  });

  await wrapTest('Given some votes', async given => {
    await createDemoData();

    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: '3' });
    await addVote({ address: 'tzn13', blockNumber: 97, type: 'allocation', ballot: '4' });

    const allocationVotes = await cgpDAL.countVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
    });
    const payoutVotes = await cgpDAL.countVotesInInterval({
      snapshot: 90,
      tally: 100,
      type: 'payout',
    });
    t.assert(allocationVotes === 2 && payoutVotes === 2, `${given}: should return the right amount of votes`);
  });
});

test('cgpDAL.findAllVoteResults() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const results = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(results.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given 1 vote per address', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '1' });

    const results = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(results.length, 1, `${given}: should return 1 result`);
    const result = results[0];
    t.equal(result.ballot, '1', `${given}: should have the right ballot`);
    t.equal(Number(result.zpAmount), 303, `${given}: should have a sum of the addresses' amount`);
  });

  await wrapTest('Given a double vote', async given => {
    await createDemoData();
    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 92, type: 'allocation', ballot: '2' });

    const results = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(results.length, 1, `${given}: should return 1 result`);
    const result = results[0];
    t.equal(result.ballot, '1', `${given}: should have the right ballot`);
    t.equal(Number(result.zpAmount), 303, `${given}: should have a sum of the addresses' amount`);
  });

  await wrapTest('Given a vote before the snapshot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 4, type: 'allocation', ballot: '1' });
    const votes = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 0, `${given}: should not calculate the vote`);
  });

  await wrapTest('Given a vote at the snapshot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 90, type: 'allocation', ballot: '1' });
    const votes = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 0, `${given}: should not calculate the vote`);
  });

  await wrapTest('Given a vote before the snapshot and a vote after the snapshot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 4, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 93, type: 'allocation', ballot: '2' });
    const votes = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 1, `${given}: should not calculate the vote`);
    t.equal(votes[0].ballot, '2', `${given}: should return the right result`);
  });

  await wrapTest('Given a vote at the tally block', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 100, type: 'allocation', ballot: '1' });
    const votes = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(votes.length, 1, `${given}: should calculate the vote`);
  });

  await wrapTest('Given each vote for different ballot', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn13', blockNumber: 93, type: 'allocation', ballot: '3' });

    const results = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(results.length, 3, `${given}: should return a result per ballot`);
    t.assert(
      results.every(item => {
        switch (item.ballot) {
          case '1':
            return ADDRESS_AMOUNTS.tzn11 / 100000000 === Number(item.zpAmount);
          case '2':
            return ADDRESS_AMOUNTS.tzn12 / 100000000 === Number(item.zpAmount);
          case '3':
            return ADDRESS_AMOUNTS.tzn13 / 100000000 === Number(item.zpAmount);
        }
        // in case something else
        return false;
      }),
      `${given}: should return the right amount per address`
    );
  });

  await wrapTest('Given some votes for different ballot and some for the same', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'allocation', ballot: '1' });
    await addVote({ address: 'tzn13', blockNumber: 93, type: 'allocation', ballot: '2' });

    const results = await cgpDAL.findAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
      limit: 1000,
      offset: 0,
    });
    t.equal(results.length, 2, `${given}: should return a result per ballot`);
    t.deepEqual(results.map(item => item.ballot), ['1', '2'], `${given}: should return all voted for ballots`);
  });
});

test('cgpDAL.countAllVoteResults() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const allocationResults = await cgpDAL.countAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
    });
    const payoutResults = await cgpDAL.countAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'payout',
    });
    t.assert(allocationResults === 0 && payoutResults === 0, `${given}: should return no results`);
  });

  await wrapTest('Given some votes', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'allocation', ballot: '3' });
    await addVote({ address: 'tzn13', blockNumber: 97, type: 'allocation', ballot: '3' });

    const allocationResults = await cgpDAL.countAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'allocation',
    });
    const payoutResults = await cgpDAL.countAllVoteResults({
      snapshot: 90,
      tally: 100,
      type: 'payout',
    });
    t.assert(allocationResults === 2 && payoutResults === 1, `${given}: should count results per ballot`);
  });
});

test('cgpDAL.findAllBallots() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const ballots = await cgpDAL.findAllBallots({ type: 'payout', snapshot: 90, tally: 100, limit: 1000, offset: 0 });
    t.equal(ballots.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given some votes in 1st interval', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: 'ballotPayout1' });
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: 'ballotPayout2' });

    const ballots = await cgpDAL.findAllBallots({ type: 'payout', snapshot: 90, tally: 100, limit: 1000, offset: 0 });
    t.equal(ballots.length, 2, `${given}: should return all ballots`);
    t.assert(ballots[0].ballot === 'ballotPayout2', `${given}: should return the ballot with most zp first`);
  });

  await wrapTest('Given some votes in 1st interval with double orders', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: 'ballotPayout1' });
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn11', blockNumber: 93, type: 'payout', ballot: 'ballotPayout2' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: 'ballotPayout2' });

    const ballots = await cgpDAL.findAllBallots({ type: 'payout', snapshot: 90, tally: 100, limit: 1000, offset: 0 });
    t.equal(ballots.length, 2, `${given}: should return all ballots except of the double votes`);
    t.assert(ballots[0].ballot === 'ballotPayout2', `${given}: should return the ballot with most zp first`);
  });

  await wrapTest('Given valid votes in 2 intervals', async given => {
    await createDemoData({toBlock: 200});
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: 'ballotPayout1' });
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'allocation', ballot: '2' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: 'ballotPayout2' });
    await addVote({ address: 'tzn11', blockNumber: 191, type: 'payout', ballot: 'ballotPayout1' });
    await addVote({ address: 'tzn12', blockNumber: 192, type: 'payout', ballot: 'ballotPayout2' });

    const ballots = await cgpDAL.findAllBallots({ type: 'payout', snapshot: 190, tally: 200, limit: 1000, offset: 0 });
    t.equal(ballots.length, 2, `${given}: should return all ballots from the given interval`);
  });

  await wrapTest('Given votes in 2 intervals outside of the voting block range', async given => {
    await createDemoData({toBlock: 200});
    await addVote({ address: 'tzn13', blockNumber: 80, type: 'payout', ballot: 'ballotPayout1' });
    await addVote({ address: 'tzn13', blockNumber: 90, type: 'payout', ballot: 'ballotPayout2' });
    await addVote({ address: 'tzn13', blockNumber: 100, type: 'payout', ballot: 'ballotPayout3' });
    await addVote({ address: 'tzn11', blockNumber: 120, type: 'payout', ballot: 'ballotPayout4' });
    await addVote({ address: 'tzn13', blockNumber: 190, type: 'payout', ballot: 'ballotPayout4' });
    await addVote({ address: 'tzn12', blockNumber: 193, type: 'payout', ballot: 'ballotPayout5' });

    const ballots = await cgpDAL.findAllBallots({ type: 'payout', snapshot: 190, tally: 200, limit: 1000, offset: 0 });
    t.equal(ballots.length, 1, `${given}: should return the ballots that are between snapshot and tally`);
    t.assert(ballots[0].ballot === 'ballotPayout5', `${given}: should return the ballot with most zp first`);
  });
});

test('cgpDAL.findZpParticipated() (DB)', async function(t) {
  await wrapTest('Given no votes', async given => {
    await createDemoData();
    const zp = await cgpDAL.findZpParticipated({ type: 'payout', snapshot: 90, tally: 100 });
    t.equal(Number(zp), 0, `${given}: should return zero`);
  });

  await wrapTest('Given valid votes', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: '2' });
    await addVote({ address: 'tzn13', blockNumber: 93, type: 'payout', ballot: '3' });
    await addVote({ address: 'tzn12', blockNumber: 94, type: 'allocation', ballot: '4' });
    const zpPayout = await cgpDAL.findZpParticipated({ snapshot: 90, tally: 100, type: 'payout' });
    const zpAllocation = await cgpDAL.findZpParticipated({ snapshot: 90, tally: 100, type: 'allocation' });
    t.assert(
      Number(zpPayout) === 30300000000 && Number(zpAllocation) == 10100000000,
      `${given}: Should return the sum of kalapas for the type`
    );
  });

  await wrapTest('Given double votes', async given => {
    await createDemoData();
    await addVote({ address: 'tzn11', blockNumber: 91, type: 'payout', ballot: '1' });
    await addVote({ address: 'tzn12', blockNumber: 92, type: 'payout', ballot: '2' });
    await addVote({ address: 'tzn13', blockNumber: 93, type: 'payout', ballot: '3' });
    await addVote({ address: 'tzn12', blockNumber: 94, type: 'allocation', ballot: '4' });
    await addVote({ address: 'tzn11', blockNumber: 95, type: 'payout', ballot: '10' });
    const zpPayout = await cgpDAL.findZpParticipated({ snapshot: 90, tally: 100, type: 'payout' });
    const zpAllocation = await cgpDAL.findZpParticipated({ snapshot: 90, tally: 100, type: 'allocation' });
    t.assert(
      Number(zpPayout) === 30300000000 && Number(zpAllocation) == 10100000000,
      `${given}: Should return the sum of kalapas for the type without double votes`
    );
  });
});

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

/**
 * Creates a range of blocks, some addresses with amount and take a snapshot
 */
async function createDemoData({ toBlock = TALLY_BLOCK } = {}) {
  // create a range of blocks
  await createDemoBlocksFromTo(1, toBlock);
  const block1 = await blocksDAL.findByBlockNumber(1);
  // add amount to some addresses all in block 1
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    const amount = ADDRESS_AMOUNTS[address];
    const tx = await transactionsDAL.create({
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });

    await blocksDAL.addTransaction(block1, tx);
  }

  // add the voting contract
  await contractsDAL.create({
    id: CONTRACT_ID,
    address: Address.getPublicKeyHashAddress('test', ContractId.fromString(CONTRACT_ID)),
    code: '',
    expiryBlock: 1000,
  });

  const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
  await snapshotsTaker.doJob();
}

async function addVote({ address, ballot, type, blockNumber, txIndex = 0 } = {}) {
  const block = await blocksDAL.findByBlockNumber(blockNumber);
  const contract = await contractsDAL.findById(CONTRACT_ID);
  const tx = await transactionsDAL.create({
    BlockId: block.id,
    index: txIndex,
    version: 0,
    inputCount: 0,
    outputCount: 1,
    hash: faker.random.uuid(),
  });
  const command = await commandsDAL.create({
    TransactionId: tx.id,
    ContractId: contract.id,
    command: type == 'payout' ? 'Payout' : 'Allocation',
    messageBody: JSON.stringify({}),
    indexInTransaction: 0,
  });

  await cgpDAL.create({
    CommandId: command.id,
    address,
    ballot,
    type,
  });
}

async function addVoteForAllAddresses({ ballot, type, blockNumber } = {}) {
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    await addVote({ address, blockNumber, ballot, type });
  }
}
