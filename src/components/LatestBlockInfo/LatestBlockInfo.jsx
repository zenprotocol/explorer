import React from 'react';
import {observer, inject} from 'mobx-react';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';

function LatestBlockInfo() {
  const {blockStore} = this.props.rootStore;
  return <div className="LatestBlockInfo">
    <span className="latest">Latest block: {blockStore.blocksCount}</span>{' '}
    <span className="timezone">{TextUtils.getTimezone()}</span>
  </div>;
}

LatestBlockInfo.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(LatestBlockInfo));
