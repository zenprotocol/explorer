import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';

export default function ThresholdRow({ thresholdPercentage, threshold, inOneColumn }) {
  const title = `THRESHOLD (${thresholdPercentage}% of total ZP issuance at snapshot)`;
  const data = AssetUtils.getAmountDivided(threshold);

  return (
    <tr>
      {inOneColumn ? (
        <td colSpan="2">
          {title}: {data}
        </td>
      ) : (
        <>
          <td>{title}</td>
          <td>{data}</td>
        </>
      )}
    </tr>
  );
}
ThresholdRow.propTypes = {
  thresholdPercentage: PropTypes.number,
  threshold: PropTypes.string,
  inOneColumn: PropTypes.bool,
};
