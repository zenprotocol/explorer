import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';
import CommitLink from './CommitLink';
import ThresholdRow from './ThresholdRow';

export default function DuringSummary(props) {
  const { phase } = props;
  return phase === 'Contestant' ? (
    <SummaryContestantPhase {...props} />
  ) : (
    <SummaryCandidatePhase {...props} />
  );
}
DuringSummary.propTypes = {
  phase: PropTypes.string,
};

function SummaryContestantPhase(props) {
  return (
    <div className="row">
      <SummaryContestant {...props} />
    </div>
  );
}
SummaryContestantPhase.propTypes = {
  winner: PropTypes.array,
};

function SummaryCandidatePhase(props) {
  return (
    <div className="row">
      <SummaryCandidate {...props} />
    </div>
  );
}
SummaryCandidatePhase.propTypes = {
  winner: PropTypes.object,
};

function SummaryContestant({ winner = [], zpParticipated = '0', threshold }) {
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
          <ThresholdRow threshold={threshold} />
          <tr>
            <td>TOTAL ZP VOTED</td>
            <td>{AssetUtils.getAmountDivided(zpParticipated)}</td>
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
};

class SummaryCandidate extends React.Component {
  constructor() {
    super();

    this.state = {
      showMore: false,
    };

    this.toggleShowMore = this.toggleShowMore.bind(this);
  }

  toggleShowMore() {
    this.setState((state) => ({ showMore: !state.showMore }));
  }

  render() {
    const { candidates, zpParticipated } = this.props;
    const { showMore } = this.state;

    const first = (candidates || []).slice(0, 5);
    const rest = (candidates || []).slice(5);

    return (
      <>
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
              <tr>
                <td>TOTAL ZP VOTED</td>
                <td>{AssetUtils.getAmountDivided(zpParticipated)}</td>
              </tr>
              <tr>
                <td>TOTAL CANDIDATES</td>
                <td>{candidates.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="col winner">
          <table className="table table-zen">
            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  COMMIT IDS PARTICIPATING
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="inner-header">
                <td>COMMIT ID</td>
                <td>TOTAL ZP VOTED</td>
              </tr>
              {first.map((candidate) => (
                <tr key={candidate.commitId}>
                  <td>
                    <CommitLink commitId={candidate.commitId} />
                  </td>
                  <td>{AssetUtils.getAmountDivided(candidate.amount)}</td>
                </tr>
              ))}
              {rest.length > 0 && (
                <tr>
                  <td colSpan="2">
                    <button type="button" className="btn py-0" onClick={this.toggleShowMore}>
                      <i className={`fas fa-caret-${showMore ? 'up' : 'down'}`} /> {rest.length}{' '}
                      more {rest.length > 1 ? 'commit IDs' : 'commit ID'}
                    </button>
                  </td>
                </tr>
              )}

              {showMore &&
                rest.length > 0 &&
                rest.map((candidate) => (
                  <tr key={candidate.commitId}>
                    <td>
                      <CommitLink commitId={candidate.commitId} />
                    </td>
                    <td>{AssetUtils.getAmountDivided(candidate.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}
SummaryCandidate.propTypes = {
  candidates: PropTypes.array,
  zpParticipated: PropTypes.string,
};
