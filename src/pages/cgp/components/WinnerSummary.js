import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../../lib/AssetUtils';
import HashLink from '../../../components/HashLink';
import AddressLink from '../../../components/AddressLink';

export default function WinnerSummary(props) {
  return (
    <div className="row">
      <SummaryAllocation {...props} />
      <SummaryPayout {...props} />
    </div>
  );
}

function SummaryAllocation({ winnerAllocation }) {
  if (!winnerAllocation) return null;

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
            <td>ALLOCATION WINNER BALLOT ID</td>
            <td>
              <HashLink hash={winnerAllocation.ballot} />
            </td>
          </tr>
          <tr>
            <td>ZP VOTED</td>
            <td>{AssetUtils.getAmountString('00', winnerAllocation.amount)}</td>
          </tr>
          <tr>
            <td>ALLOCATION RESULT</td>
            <td>{winnerAllocation.content.allocation}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
SummaryAllocation.propTypes = {
  winnerAllocation: PropTypes.object,
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
    const { winnerPayout } = this.props;
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
            <tr>
              <td>PAYOUT WINNER BALLOT ID</td>
              <td>
                <HashLink hash={winnerPayout.ballot} />
              </td>
            </tr>
            <tr>
              <td>ZP VOTED</td>
              <td>{AssetUtils.getAmountString('00', winnerPayout.amount)}</td>
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
                  <td>
                    {AssetUtils.getAmountString(spend.asset, spend.amount)}
                  </td>
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
};
