import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextUtils from '../../../lib/TextUtils';

export default class PageDescription extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMore: false,
    };

    this.toggleShowMore = this.toggleShowMore.bind(this);
  }

  toggleShowMore() {
    this.setState((state) => ({ showMore: !state.showMore }));
  }

  render() {
    const { showMore } = this.state;
    const { intervalLength } = this.props;

    const votingRound = intervalLength * 0.1;
    const phaseLength = votingRound / 2;

    const readButton = (
      <button type="button" className="btn py-0 px-0 btn-link" onClick={this.toggleShowMore}>
        <span className="pr-2">Read {showMore ? 'less' : 'more'}</span>
        <i className={`fas fa-caret-${showMore ? 'up' : 'down'}`} />
      </button>
    );

    const basicText = (
      <>
        <p>
          Every {TextUtils.formatNumber(intervalLength)} blocks, token holders can vote to determine
          what percentage of newly minted coins will go to miners, and what percentage will go to
          the Common Goods Pool. In addition token holders will be able to vote on what it should do
          with its funds, based on token weighted basis.
          <br />
          <i>*The CGP fund can pay out up to 100 different assets on each interval.</i>
        </p>
        <p>
          <strong>
            Each voting round ({TextUtils.formatNumber(votingRound)} blocks) consists of:
          </strong>{' '}
          Two phases: Nomination and Voting phase ({TextUtils.formatNumber(phaseLength)} blocks
          each), one Snapshot and a Tally block. {!showMore && readButton}
        </p>
      </>
    );

    const moreText = (
      <>
        <p>
          <strong>First phase: Nomination phase:</strong> Token holders can vote for their preferred
          Proposal’s Ballot ID. Only these in which received an aggregation vote weight of more than
          3% of the total issued ZP, will be considered eligible Ballot ID in the second Voting
          phase. and as long as there is enough Funds in the CGP.
          <br />
          <strong>Second phase: Voting phase:</strong> Token holders can vote both on their
          preferred eligible Ballot ID, to win from the CGP funds, and on the amount of ZP they
          believe should be allocated to the CGP fund from Miner’s Reward. {showMore && readButton}
        </p>
      </>
    );

    return (
      <div>
        {basicText}
        {showMore && moreText}
      </div>
    );
  }
}
PageDescription.propTypes = {
  intervalLength: PropTypes.number,
};
