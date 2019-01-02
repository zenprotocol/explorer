import React from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';

function LatestBlockInfo() {
  const { blockStore } = this.props.rootStore;
  const { blockNumber, timestamp } = blockStore.latestBlock;
  if(blockStore.loading.latestBlock || !Object.keys(blockStore.latestBlock).length) {
    return null;
  }
  
  return (
    <div className="LatestBlockInfo">
      <span className="latest">Latest block: {blockNumber}</span>{', '}
      <span className="timezone">{TextUtils.getDateStringFromTimestamp(timestamp)}</span>
    </div>
  );
}

LatestBlockInfo.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(LatestBlockInfo));
