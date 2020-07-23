import React from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';

function LatestBlockInfo(props) {
  const { blockStore } = props.rootStore;
  const { blockNumber, timestamp } = blockStore.latestBlock;
  if (!Object.keys(blockStore.latestBlock).length) {
    return null;
  }

  return (
    <div className="LatestBlockInfo">
      <span className="latest">Latest block: </span>
      <Link to={`/blocks/${blockNumber}`}>{TextUtils.formatNumber(blockNumber)}</Link>
      {', '}
      <span className="timezone">{TextUtils.getDateStringFromTimestamp(timestamp)}</span>
    </div>
  );
}

LatestBlockInfo.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(LatestBlockInfo));
