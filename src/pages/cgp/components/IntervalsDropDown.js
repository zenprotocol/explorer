import React from 'react';
import PropTypes from 'prop-types';
import TextUtils from '../../../lib/TextUtils';
import Dropdown from '../../../components/Dropdown';

export default function IntervalsDropDown({ relevantInterval, currentInterval, currentBlock, onIntervalChange }) {
  if (!(relevantInterval || {}).interval) return null;

  const maturityBlocks = relevantInterval.coinbaseMaturity - relevantInterval.tally;
  const intervalLength = relevantInterval.tally / relevantInterval.interval;

  let intervals = [relevantInterval.interval];
  for (let i = 1; i < 5; i++) {
    // interval below
    if (relevantInterval.interval - i > 0) {
      intervals = [...intervals, relevantInterval.interval - i];
    }
    // above
    if (relevantInterval.interval + i <= currentInterval) {
      if((relevantInterval.interval + i - 1) * intervalLength + maturityBlocks < currentBlock) {
        intervals = [relevantInterval.interval + i, ...intervals];
      }
    }
  }

  const options = intervals.map(interval => {
    return {
      value: String(interval),
      label: `${TextUtils.getOrdinal(interval)} Interval`,
    };
  });
  return (
    <Dropdown
      options={options}
      value={String(relevantInterval.interval)}
      onChange={onIntervalChange}
    />
  );
}
IntervalsDropDown.propTypes = {
  relevantInterval: PropTypes.object,
  currentInterval: PropTypes.number.isRequired,
  currentBlock: PropTypes.number.isRequired,
  onIntervalChange: PropTypes.func,
};
