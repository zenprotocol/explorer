import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';
import TextUtils from '../../../lib/TextUtils';
import { defaultCommitId } from '../constants';
import ThresholdRow from './ThresholdRow';
import CommitLink from './CommitLink';

export default function WinnerSummary(props) {
  const { phase } = props;
  return phase === 'Contestant' ? (
    <SummaryContestant {...props} />
  ) : (
    <SummaryCandidate {...props} />
  );
}
WinnerSummary.propTypes = {
  phase: PropTypes.string,
};

function SummaryContestant({
  currentBlock,
  winner,
  zpParticipated,
  coinbaseMaturity,
  threshold,
  phase,
}) {
  const hasWinner = Boolean(winner && winner.length);
  return (
    <div className="row">
      <div className="col winner">
        <table className="table table-zen">
          <thead>
            <tr>
              <th scope="col" colSpan="2">
                CONTESTANTS PHASE SUMMARY
              </th>
            </tr>
          </thead>
          <tbody>
            <UnconfirmedRow currentBlock={currentBlock} coinbaseMaturity={coinbaseMaturity} />
            <ThresholdRow threshold={threshold} />
            <tr>
              <td>TOTAL ZP VOTED</td>
              <td>{AssetUtils.getAmountString('00', zpParticipated)}</td>
            </tr>
            {hasWinner ? (
              <tr>
                <td>TOTAL CONTESTANTS</td>
                <td>{winner.length}</td>
              </tr>
            ) : (
              <NoWinnerRow phase={phase} zpParticipated={zpParticipated} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
SummaryContestant.propTypes = {
  winner: PropTypes.array,
  zpParticipated: PropTypes.string,
  threshold: PropTypes.string,
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
  phase: PropTypes.string,
};

function SummaryCandidate(props) {
  const { winner, zpParticipated } = props;
  const hasWinner = !!winner;

  return (
    <div className="row">
      <div className="col winner">
        <table className="table table-zen">
          <thead>
            <tr>
              <th scope="col" colSpan="2">
                CANDIDATES PHASE SUMMARY
              </th>
            </tr>
          </thead>
          <tbody>
            <UnconfirmedRow {...props} />
            <tr>
              <td>TOTAL ZP VOTED</td>
              <td>{AssetUtils.getAmountString('00', zpParticipated)}</td>
            </tr>
            {hasWinner ? (
              <>
                <tr>
                  <td>ZP VOTED FOR WINNER</td>
                  <td>{AssetUtils.getAmountString('00', winner.amount)}</td>
                </tr>
                <tr>
                  <td>WINNER COMMIT</td>
                  <td>
                    <CommitLink commitId={winner.commitId} />
                  </td>
                </tr>
              </>
            ) : (
              <>
                <NoWinnerRow {...props} />
                <tr>
                  <td colSpan="2">
                    No changes to the protocol: <CommitLink commitId={defaultCommitId} />
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
SummaryCandidate.propTypes = {
  winner: PropTypes.object,
  zpParticipated: PropTypes.string,
};

function UnconfirmedRow({ currentBlock, coinbaseMaturity }) {
  return currentBlock < coinbaseMaturity ? (
    <tr className="text-danger">
      <td colSpan="2">Unconfirmed until block {TextUtils.formatNumber(coinbaseMaturity)}</td>
    </tr>
  ) : null;
}
UnconfirmedRow.propTypes = {
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
};

function NoWinnerRow({ phase, zpParticipated }) {
  return (
    <tr>
      <td colSpan="2">
        {/* payout - if no result but people voted it means tie */}
        NO WINNER{phase === 'Candidate' && zpParticipated > 0 && ' - TIE'}
      </td>
    </tr>
  );
}

NoWinnerRow.propTypes = {
  phase: PropTypes.oneOf(['Contestant', 'Candidate']),
  zpParticipated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
