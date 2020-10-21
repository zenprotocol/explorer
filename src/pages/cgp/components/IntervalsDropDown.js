import React from 'react';
import PropTypes from 'prop-types';
import TextUtils from '../../../lib/TextUtils';
import Dropdown from '../../../components/Dropdown';
import getPhaseName from '../modules/getPhaseName';

export default function IntervalsDropDown({
  intervalLength,
  relevantInterval,
  currentInterval,
  currentBlock,
  onIntervalChange,
}) {
  if (!(relevantInterval || {}).interval) return null;

  const maturityBlocks = relevantInterval.coinbaseMaturity - relevantInterval.tally;

  let intervals = [relevantInterval.interval];
  for (let i = 1; i < 5; i++) {
    // interval below
    if (relevantInterval.interval - i > 0) {
      intervals = [...intervals, relevantInterval.interval - i];
    }
    // above
    if (relevantInterval.interval + i <= currentInterval) {
      if ((relevantInterval.interval + i - 1) * intervalLength + maturityBlocks < currentBlock) {
        intervals = [relevantInterval.interval + i, ...intervals];
      }
    }
  }

  // add the current interval on top
  if (intervals.length && intervals[0] < currentInterval) {
    intervals = [currentInterval, ...intervals];
  }

  // for each interval add the 2 phases
  const options = intervals.reduce((all, interval) => {
    all.push({
      value: JSON.stringify({ interval, phase: 'Vote' }),
      label: `${TextUtils.getOrdinal(interval)} Interval - ${getPhaseName('Vote')} phase`,
    });
    all.push({
      value: JSON.stringify({ interval, phase: 'Nomination' }),
      label: `${TextUtils.getOrdinal(interval)} Interval - ${getPhaseName('Nomination')} phase`,
    });
    return all;
  }, []);

  const handleChange = data => {
    typeof onIntervalChange === 'function' && onIntervalChange(JSON.parse(data.value));
  };
  return (
    <Dropdown
      options={options}
      value={JSON.stringify({ interval: relevantInterval.interval, phase: relevantInterval.phase })}
      onChange={handleChange}
    />
  );
}
IntervalsDropDown.propTypes = {
  intervalLength: PropTypes.number,
  relevantInterval: PropTypes.object,
  currentInterval: PropTypes.number.isRequired,
  currentBlock: PropTypes.number.isRequired,
  onIntervalChange: PropTypes.func,
};
