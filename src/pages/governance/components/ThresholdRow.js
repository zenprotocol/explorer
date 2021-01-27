import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';

export default function ThresholdRow({ threshold, inOneColumn }) {
  const title = 'THRESHOLD';
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
  threshold: PropTypes.string,
  inOneColumn: PropTypes.bool,
};
