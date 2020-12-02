'use strict';

const { mergeAll } = require('ramda');
const { Decimal } = require('decimal.js');
const config = require('../../../config/Config');
const calcTotalZpByHeight = require('../../../lib/calcTotalZpByHeight');

function getIntervalLength(chain) {
  return config.get(`cgp:${chain}:intervalLength`);
}

function getThresholdPercentage(chain) {
  return config.get(`cgp:${chain}:thresholdPercentage`);
}

function getCoinbaseMaturity(chain) {
  return config.get(`coinbaseMaturity:${chain}`);
}

function getIntervalByBlockNumber(chain, blockNumber) {
  return Math.ceil(blockNumber / getIntervalLength(chain));
}

function getIntervalBlocks(chain, interval) {
  const intervalLength = getIntervalLength(chain);
  const snapshot = (interval - 1) * intervalLength + intervalLength * 0.9;
  const tally = interval * intervalLength;

  return {
    snapshot,
    tally,
    coinbaseMaturity: tally + getCoinbaseMaturity(chain),
  };
}

/**
 * Get interval snapshot and tally blocks by:
 * 1. if interval is supplied, by that interval
 * 2. previous interval if currentBlock - prev.endBlock < maturity
 * 3. on going interval
 */
function getRelevantIntervalBlocks({ chain, interval, phase, currentBlock } = {}) {
  let chosenInterval = interval;
  let chosenPhase = phase;

  if (!chosenInterval) {
    const afterTallyBlocks = config.get(`cgp:${chain}:afterTallyBlocks`);
    const currentInterval = getIntervalByBlockNumber(chain, currentBlock);
    const intervalLength = getIntervalLength(chain);
    const shouldGetPrevInterval =
      currentInterval > 1 &&
      currentBlock - intervalLength * (currentInterval - 1) <= afterTallyBlocks;
    chosenInterval =
      currentInterval === 1 ? 1 : shouldGetPrevInterval ? currentInterval - 1 : currentInterval;
  }
  const chosenIntervalBlocks = getIntervalBlocks(chain, chosenInterval);
  if (!chosenPhase) {
    const { snapshot, tally } = chosenIntervalBlocks;
    const middlePoint = snapshot + (tally - snapshot) / 2;
    /**
     * in case both interval and block was given, block should be ignored
     * return phase = vote if currentBlock > tally (prev interval)
     */
    chosenPhase = interval
      ? 'Nomination'
      : currentBlock > 0
      ? currentBlock < middlePoint
        ? 'Nomination'
        : 'Vote'
      : 'Nomination';
  }

  return mergeAll([{ interval: chosenInterval }, chosenIntervalBlocks, { phase: chosenPhase }]);
}

/**
 * Get the beginBlock and endBlock of a phase
 * @param {Object} params
 * @param {Chain} params.chain
 * @param {number} params.interval
 * @param {string} params.type
 */
function getPhaseBlocks({ chain, interval, type } = {}) {
  const { snapshot, tally } = getIntervalBlocks(chain, interval);
  const middle = snapshot + (tally - snapshot) / 2;

  return type.toLowerCase() === 'nomination'
    ? { beginBlock: snapshot, endBlock: middle }
    : { beginBlock: middle, endBlock: tally };
}

/**
 * Get the threshold in ZP Kalapas at the given height
 *
 * @param {Object} params
 * @param {(number|string)} params.height - the height at which to calculate
 * @param {(number|string)} params.genesisTotal - the genesis total in ZP
 * @param {Chain} params.chain - the current chain
 * @returns (string) the threshold at the given height in Kalapas
 */
function getThreshold({ height, genesisTotal = 0, chain = 'main' } = {}) {
  const threshold = new Decimal(calcTotalZpByHeight({ genesis: genesisTotal, height }))
    .times(config.get(`cgp:${chain}:thresholdPercentage`))
    .div(100);

  return threshold.floor().toString();
}

module.exports = {
  getIntervalLength,
  getCoinbaseMaturity,
  getIntervalByBlockNumber,
  getIntervalBlocks,
  getRelevantIntervalBlocks,
  getThresholdPercentage,
  getThreshold,
  getPhaseBlocks,
};

/**
 * @typedef {("main"|"test")} Chain
 */
