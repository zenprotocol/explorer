import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import percentageToZP from '../../../lib/rewardPercentageToZP';
import calcTimeRemaining from '../../../lib/calcTimeRemaining';
import InfoBox from '../../../components/InfoBox';
import getPhaseBlocks from '../modules/getPhaseBlocks';
import getPhaseName from '../modules/getPhaseName';
import { voteStatus as VoteStatus } from '../modules/cgpVoteStatus';
import './InfoBoxes.scss';

const { truncateHash, formatNumber } = TextUtils;

/**
 * Renders info boxes based on the current vote status
 */
export default function InfoBoxes({ voteStatus, ...props }) {
  return voteStatus === VoteStatus.before ? (
    <BeforeVoteInfo {...props} />
  ) : voteStatus === VoteStatus.during ? (
    <DuringVoteInfo {...props} />
  ) : voteStatus === VoteStatus.after ? (
    <AfterVoteInfo {...props} />
  ) : null;
}
InfoBoxes.propTypes = {
  voteStatus: PropTypes.number,
};

function BeforeVoteInfo({ currentBlock, snapshot, tally, phase, ...props }) {
  const phaseBlocks = getPhaseBlocks({ phase, snapshot, tally });
  const blocksToStart = phaseBlocks.snapshot - currentBlock;
  const timeRemaining = calcTimeRemaining(blocksToStart);
  const phaseName = getPhaseName(phase);
  const voteBeginsMessage = `${phaseName} phase begins in ${formatNumber(blocksToStart)} ${
    blocksToStart > 1 ? 'blocks' : 'block'
  }`;

  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title={phase === 'Nomination' ? 'Snapshot block' : 'Voting block'}
          content={formatNumber(phaseBlocks.snapshot)}
          iconClass="fal fa-cubes fa-fw"
        />
        <CgpAllocationInfoBox {...props} addAtSnapshotText={false} currentBlock={currentBlock} />
        <CgpBalanceInfoBox {...props} addAtSnapshotText={false} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          {voteBeginsMessage}, ~ {timeRemaining}
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  phase: PropTypes.string,
};

function DuringVoteInfo({ currentBlock, snapshot, tally, phase, ...props }) {
  const phaseBlocks = getPhaseBlocks({ phase, snapshot, tally });
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title={phase === 'Nomination' ? 'Voting block' : 'Tally block'}
          content={formatNumber(phaseBlocks.tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpAllocationInfoBox {...props} addAtSnapshotText={true} currentBlock={currentBlock} />
        <CgpBalanceInfoBox {...props} addAtSnapshotText={true} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center during-vote-message">
          {getPhaseName(phase)} phase is open
        </div>
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  phase: PropTypes.string,
};

function AfterVoteInfo({ snapshot, tally, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={formatNumber(snapshot)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally block"
          content={formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpAllocationInfoBox {...props} addAtSnapshotText={true} />
        <CgpBalanceInfoBox {...props} addAtSnapshotText={true} />
      </div>
    </div>
  );
}
AfterVoteInfo.propTypes = {
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  currentBlock: PropTypes.number,
};

function CgpBalanceInfoBox({ cgpBalance, addAtSnapshotText = false, contractAddress } = {}) {
  let zpBalance = cgpBalance.find(item => AssetUtils.isZP(item.asset));
  const balanceHasZp = !!zpBalance;
  if (!zpBalance) {
    zpBalance = {
      asset: '00',
      amount: '0',
    };
  }
  const allAssetsString = cgpBalance.reduce((all, cur) => {
    const currentAsset = truncateHash(AssetUtils.getAssetNameFromCode(cur.asset));
    const currentDisplay = `${currentAsset}: ${AssetUtils.getAmountDivided(cur.amount)}`;
    return !all ? currentDisplay : `${all}\n${currentDisplay}`;
  }, '');
  const extraAssetsCount = balanceHasZp ? cgpBalance.length - 1 : cgpBalance.length;
  return (
    <InfoBox
      title={addAtSnapshotText ? 'Funds in CGP at snapshot' : 'Current funds in CGP'}
      content={
        <div className="CgpBalanceInfoBox-content" title={allAssetsString}>
          {AssetUtils.getAmountDivided(zpBalance.amount)} ZP
          {extraAssetsCount > 0 && (
            <div className="extra-asset-count">
              <Link to={`/contracts/${contractAddress}`}>+{extraAssetsCount}</Link>
            </div>
          )}
        </div>
      }
      iconClass="fal fa-coins fa-fw"
    />
  );
}
CgpBalanceInfoBox.propTypes = {
  cgpBalance: PropTypes.array,
  addAtSnapshotText: PropTypes.bool,
  contractAddress: PropTypes.string,
};
CgpBalanceInfoBox.defaultProps = {
  cgpBalance: [],
};

/**
 * Displays the latest winner allocation
 */
function CgpAllocationInfoBox({ currentAllocation, addAtSnapshotText, currentBlock } = {}) {
  return (
    <InfoBox
      title={addAtSnapshotText ? 'CGP allocation at snapshot' : 'CGP current allocation'}
      content={`${percentageToZP({ percentage: currentAllocation, height: currentBlock })} ZP`}
      iconClass="fal fa-coins fa-fw"
    />
  );
}
CgpAllocationInfoBox.propTypes = {
  currentAllocation: PropTypes.number,
  addAtSnapshotText: PropTypes.bool,
  currentBlock: PropTypes.number,
};
