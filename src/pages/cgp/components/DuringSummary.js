import React from 'react';
import PropTypes from 'prop-types';
import { Decimal } from 'decimal.js';
import AssetUtils from '../../../lib/AssetUtils';
import HashLink from '../../../components/HashLink';
import percentageToZP from '../../../lib/rewardPercentageToZP';
import getAllocationBounce from '../modules/getAllocationBounce';

export default function DuringSummary(props) {
  const { phase } = props;
  return phase === 'Nomination' ? (
    <SummaryNominationPhase {...props} />
  ) : (
    <SummaryVotePhase {...props} />
  );
}
DuringSummary.propTypes = {
  phase: PropTypes.string,
};

function SummaryNominationPhase(props) {
  return (
    <div className="row">
      <SummaryNomination {...props} />
    </div>
  );
}
SummaryNominationPhase.propTypes = {
  winnersNomination: PropTypes.array,
};

function SummaryVotePhase(props) {
  return (
    <div className="row">
      <SummaryVoting {...props} />
      <SummaryParticipants {...props} />
    </div>
  );
}
SummaryVotePhase.propTypes = {
  winnerAllocation: PropTypes.number,
  winnerPayout: PropTypes.object,
};

function SummaryNomination({
  winnersNomination = [],
  zpParticipatedNomination = 0,
  threshold,
  thresholdPercentage,
}) {
  return (
    <div className="col winner">
      <table className="table table-zen">
        <thead>
          <tr>
            <th scope="col" colSpan="2">
              NOMINATION SUMMARY
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>THRESHOLD AT SNAPSHOT ({thresholdPercentage}%)</td>
            <td>{AssetUtils.getAmountString('00', threshold)}</td>
          </tr>
          <tr>
            <td>TOTAL ZP VOTED</td>
            <td>{AssetUtils.getAmountString('00', zpParticipatedNomination)}</td>
          </tr>
          <tr>
            <td>TOTAL NOMINEES</td>
            <td>{winnersNomination.length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
SummaryNomination.propTypes = {
  winnersNomination: PropTypes.array,
  zpParticipatedNomination: PropTypes.string,
  threshold: PropTypes.string,
  thresholdPercentage: PropTypes.number,
};

function SummaryVoting({
  snapshot,
  winnerAllocation,
  zpParticipatedAllocation,
  currentBlock,
  currentAllocation,
}) {
  const bounce = getAllocationBounce({ prevAllocation: currentAllocation });
  const bounceZP = {
    min: new Decimal(percentageToZP({ percentage: bounce.min, height: snapshot }))
      .toNearest(0.5, Decimal.ROUND_CEIL)
      .toString(),
    max: new Decimal(percentageToZP({ percentage: bounce.max, height: snapshot }))
      .toNearest(0.5, Decimal.ROUND_FLOOR)
      .toString(),
  };
  return (
    <div className="col winner">
      <table className="table table-zen">
        <thead>
          <tr>
            <th scope="col" colSpan="2">
              ALLOCATION SUMMARY
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TOTAL ZP VOTED FOR ALLOCATION</td>
            <td>{AssetUtils.getAmountString('00', zpParticipatedAllocation)}</td>
          </tr>
          <tr>
            <td>ALLOCATION BOUNCE</td>
            <td className="text-nowrap">
              {bounceZP.min}-{bounceZP.max} ZP
            </td>
          </tr>
          <tr>
            <td>PROPOSED CGP ALLOCATION</td>
            <td>{percentageToZP({ percentage: winnerAllocation, height: currentBlock })} ZP</td>
          </tr>
          <tr>
            <td>PROPOSED MINER ALLOCATION</td>
            <td>
              {percentageToZP({ percentage: 100 - winnerAllocation, height: currentBlock })} ZP
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
SummaryVoting.propTypes = {
  snapshot: PropTypes.number,
  winnerAllocation: PropTypes.number,
  zpParticipatedAllocation: PropTypes.string,
  zpParticipatedPayout: PropTypes.string,
  currentBlock: PropTypes.number,
  currentAllocation: PropTypes.number,
};

class SummaryParticipants extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMore: false,
    };

    this.toggleShowMore = this.toggleShowMore.bind(this);
  }

  toggleShowMore() {
    this.setState(state => ({ showMore: !state.showMore }));
  }

  render() {
    const { nominees, zpParticipatedPayout } = this.props;
    const { showMore } = this.state;

    const first = (nominees || []).slice(0, 5);
    const rest = (nominees || []).slice(5);

    return (
      <div className="col winner">
        <table className="table table-zen">
          <thead>
            <tr>
              <th scope="col" colSpan="2">
                PAYOUT BALLOTS PARTICIPATING
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TOTAL ZP VOTED FOR CGP PAYOUT</td>
              <td>{AssetUtils.getAmountString('00', zpParticipatedPayout)}</td>
            </tr>
            <tr className="inner-header">
              <td>PAYOUT BALLOT</td>
              <td>TOTAL ZP VOTED</td>
            </tr>
            {first.map(nominee => (
              <tr key={nominee.ballot}>
                <td>
                  <HashLink hash={nominee.ballot} />
                </td>
                <td>{AssetUtils.getAmountString('00', nominee.amount)}</td>
              </tr>
            ))}
            {rest.length > 0 && (
              <tr>
                <td colSpan="2">
                  <button type="button" className="btn py-0" onClick={this.toggleShowMore}>
                    <i className={`fas fa-caret-${showMore ? 'up' : 'down'}`} /> {rest.length} more{' '}
                    {rest.length > 1 ? 'ballots' : 'ballot'}
                  </button>
                </td>
              </tr>
            )}

            {showMore &&
              rest.length > 0 &&
              rest.map(nominee => (
                <tr key={nominee.ballot}>
                  <td>
                    <HashLink hash={nominee.ballot} />
                  </td>
                  <td>{AssetUtils.getAmountString('00', nominee.amount)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }
}
SummaryParticipants.propTypes = {
  nominees: PropTypes.array,
  zpParticipatedPayout: PropTypes.string,
};
