import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';
import HashLink from '../../../components/HashLink';
import AddressLink from '../../../components/AddressLink';
import percentageToZP from '../../../lib/rewardPercentageToZP';

export default function WinnerSummary(props) {
  const { phase } = props;
  return phase === 'Nomination' ? (
    <SummaryNominationPhase {...props} />
  ) : (
    <SummaryVotePhase {...props} />
  );
}
WinnerSummary.propTypes = {
  phase: PropTypes.string,
};

function SummaryNominationPhase(props) {
  return <div className="row">
    {props.winnersNomination && props.winnersNomination.length ? (
        <SummaryNomination {...props} />
      ) : (
        <NoWinner {...props} type="nomination" />
      )}
  </div>;
}
SummaryNominationPhase.propTypes = {
  winnersNomination: PropTypes.array
};
function SummaryVotePhase(props) {
  return (
    <div className="row">
      {props.winnerAllocation !== null ? (
        <SummaryAllocation {...props} />
      ) : (
        <NoWinner {...props} type="allocation" />
      )}
      {props.winnerPayout !== null ? (
        <SummaryPayout {...props} />
      ) : (
        <NoWinner {...props} type="payout" />
      )}
    </div>
  );
}
SummaryVotePhase.propTypes = {
  winnerAllocation: PropTypes.number,
  winnerPayout: PropTypes.object,
};

function SummaryNomination({
  winnersNomination,
  zpParticipatedNomination,
  currentBlock,
  coinbaseMaturity,
  thresholdPercentage,
  threshold,
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
          <UnconfirmedRow currentBlock={currentBlock} coinbaseMaturity={coinbaseMaturity} />
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
  thresholdPercentage: PropTypes.number,
  threshold: PropTypes.string,
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
};

function SummaryAllocation({
  winnerAllocation,
  zpParticipatedAllocation,
  currentBlock,
  coinbaseMaturity,
}) {
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
          <UnconfirmedRow currentBlock={currentBlock} coinbaseMaturity={coinbaseMaturity} />
          <tr>
            <td>TOTAL ZP VOTED</td>
            <td>{AssetUtils.getAmountString('00', zpParticipatedAllocation)}</td>
          </tr>
          <tr>
            <td>CGP ALLOCATION</td>
            <td>{percentageToZP({ percentage: winnerAllocation, height: currentBlock })} ZP</td>
          </tr>
          <tr>
            <td>MINER ALLOCATION</td>
            <td>
              {percentageToZP({ percentage: 100 - winnerAllocation, height: currentBlock })} ZP
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
SummaryAllocation.propTypes = {
  winnerAllocation: PropTypes.number,
  zpParticipatedAllocation: PropTypes.string,
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
};

class SummaryPayout extends React.Component {
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
    const { winnerPayout, zpParticipatedPayout } = this.props;
    if (!winnerPayout) return null;

    const spendsZP = this.getSpendsZP();
    const spends = winnerPayout.content.spends;
    const spendsRestAmount = spends.length - (spendsZP ? 1 : 0);
    const { showMore } = this.state;

    return (
      <div className="col winner">
        <table className="table table-zen">
          <thead>
            <tr>
              <th scope="col" colSpan="2">
                PAYOUT SUMMARY
              </th>
            </tr>
          </thead>
          <tbody>
            <UnconfirmedRow {...this.props} />
            <tr>
              <td>TOTAL ZP VOTED</td>
              <td>{AssetUtils.getAmountString('00', zpParticipatedPayout)}</td>
            </tr>
            <tr>
              <td>ZP VOTED FOR WINNER</td>
              <td>{AssetUtils.getAmountString('00', winnerPayout.amount)}</td>
            </tr>
            <tr>
              <td>PAYOUT WINNER BALLOT</td>
              <td>
                <HashLink hash={winnerPayout.ballot} />
              </td>
            </tr>
            <tr>
              <td>PAYOUT WINNER RECIPIENT</td>
              <td>
                <AddressLink
                  address={winnerPayout.content.recipient.address}
                  hash={winnerPayout.content.recipient.address}
                />
              </td>
            </tr>
            <tr>
              <td>PAYOUT WINNER SPENDS</td>
              <td>
                {!!spendsZP && AssetUtils.getAmountString('00', spendsZP.amount)}
                {!!spendsZP && spendsRestAmount > 0 && ' + '}
                {spendsRestAmount > 0 &&
                  `${spendsRestAmount} ${spendsRestAmount > 1 ? 'Assets' : 'Asset'}`}
                {spendsRestAmount > 0 && (
                  <button type="button" className="btn py-0" onClick={this.toggleShowMore}>
                    <i className={`fas fa-caret-${showMore ? 'up' : 'down'}`} />
                  </button>
                )}
              </td>
            </tr>
            {showMore &&
              spends.length > 0 &&
              spends.map((spend, index) => (
                <tr key={index}>
                  <td>
                    <HashLink
                      hash={AssetUtils.getAssetNameFromCode(spend.asset)}
                      value={spend.asset}
                      url={`/assets/${spend.asset}`}
                    />
                  </td>
                  <td>{AssetUtils.getAmountString(spend.asset, spend.amount)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  getSpendsZP() {
    const { winnerPayout } = this.props;
    if (!winnerPayout) return null;

    return winnerPayout.content.spends.find(item => AssetUtils.isZP(item.asset));
  }
}
SummaryPayout.propTypes = {
  winnerPayout: PropTypes.object,
  zpParticipatedPayout: PropTypes.string,
};

function UnconfirmedRow({ currentBlock, coinbaseMaturity }) {
  return currentBlock < coinbaseMaturity ? (
    <tr className="text-danger">
      <td colSpan="2">Unconfirmed until block {coinbaseMaturity}</td>
    </tr>
  ) : null;
}
UnconfirmedRow.propTypes = {
  currentBlock: PropTypes.number,
  coinbaseMaturity: PropTypes.number,
};

function NoWinner({ type, zpParticipatedPayout }) {
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
              NO WINNER{type === 'payout' && zpParticipatedPayout > 0 && ' - TIE'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

NoWinner.propTypes = {
  type: PropTypes.oneOf(['allocation', 'payout', 'nomination']),
  zpParticipatedPayout: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
