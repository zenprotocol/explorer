import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';
import TextUtils from '../../../lib/TextUtils';
import ThresholdRow from './ThresholdRow';
import CommitLink from './CommitLink';

export default function WinnerSummary(props) {
  const { phase } = props;
  return phase === 'Contestant' ? (
    <SummaryContestantContainer {...props} />
  ) : (
    <SummaryCandidateContainer {...props} />
  );
}
WinnerSummary.propTypes = {
  phase: PropTypes.string,
};

function SummaryContestantContainer(props) {
  return (
    <div className="row">
      {props.winner && props.winner.length ? (
        <SummaryContestant {...props} />
      ) : (
        <NoWinner {...props} type="contestants" addRows={<ThresholdRow {...props} inOneColumn />} />
      )}
    </div>
  );
}
SummaryContestantContainer.propTypes = {
  winner: PropTypes.array,
};
function SummaryCandidateContainer(props) {
  return (
    <div className="row">
      {props.winner !== null ? (
        <SummaryCandidate {...props} />
      ) : (
        <NoWinner {...props} type="candidates" />
      )}
    </div>
  );
}
SummaryCandidateContainer.propTypes = {
  winner: PropTypes.object,
};

function SummaryContestant({
  currentBlock,
  winner,
  zpParticipated,
  coinbaseMaturity,
  threshold,
}) {
  return (
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
          <tr>
            <td>TOTAL CONTESTANTS</td>
            <td>{winner.length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
SummaryContestant.propTypes = {
  winner: PropTypes.array,
  zpParticipated: PropTypes.string,
  threshold: PropTypes.string,
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
};

function SummaryCandidate(props) {
  const { winner, zpParticipated } = props;
  if (!winner) return null;

  return (
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
        </tbody>
      </table>
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

function NoWinner({ type, zpParticipated, addRows }) {
  return (
    <div className="col winner">
      <table className="table table-zen">
        <thead>
          <tr>
            <th scope="col" colSpan="2">
              {type.toUpperCase()} SUMMARY
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="2">
              {/* payout - if no result but people voted it means tie */}
              NO WINNER{type === 'candidates' && zpParticipated > 0 && ' - TIE'}
            </td>
          </tr>
          {addRows}
        </tbody>
      </table>
    </div>
  );
}

NoWinner.propTypes = {
  type: PropTypes.oneOf(['contestants', 'candidates']),
  zpParticipated: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  addRows: PropTypes.any,
};
