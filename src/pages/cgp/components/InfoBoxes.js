import React from 'react';
import PropTypes from 'prop-types';

import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import InfoBox from '../../../components/InfoBox';

function CgpBalanceInfoBox({ cgpBalance }) {
  const zpBalance = cgpBalance.find(item => AssetUtils.isZP(item.asset)) || {
    asset: '00',
    amount: '0',
  };
  const allAssetsString = cgpBalance.reduce((all, cur) => {
    const currentAsset = TextUtils.truncateHash(AssetUtils.getAssetNameFromCode(cur.asset));
    const currentDisplay = `${currentAsset}: ${AssetUtils.getAmountString(cur.asset, cur.amount)}`;
    return !all ? currentDisplay : `${all}\n${currentDisplay}`;
  }, '');
  return (
    <InfoBox
      title="Funds In CGP"
      content={
        <div title={allAssetsString}>
          {AssetUtils.getAmountString(zpBalance.asset, zpBalance.amount)}
        </div>
      }
      iconClass="fal fa-coins fa-fw"
    />
  );
}
CgpBalanceInfoBox.propTypes = {
  cgpBalance: PropTypes.array,
};
CgpBalanceInfoBox.defaultProps = {
  cgpBalance: [],
};

export function BeforeVoteInfo({ currentBlock, snapshot, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(snapshot)}
          iconClass="fal fa-cubes fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          VOTE BEGINS IN {TextUtils.formatNumber(snapshot - currentBlock)} BLOCKS
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
};

export function DuringVoteInfo({ currentBlock, tally, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  tally: PropTypes.number,
};

export function AfterVoteInfo({ snapshot, tally, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(snapshot)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
    </div>
  );
}
AfterVoteInfo.propTypes = {
  snapshot: PropTypes.number,
  tally: PropTypes.number,
};
