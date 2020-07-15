import React, { Component } from 'react';
import ExternalLink from '../../../components/ExternalLink';

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

    const readButton = (
      <button type="button" className="btn py-0 px-0 btn-link" onClick={this.toggleShowMore}>
        <span className="pr-2">Read {showMore ? 'less' : 'more'}</span>
        <i className={`fas fa-caret-${showMore ? 'up' : 'down'}`} />
      </button>
    );

    const basicText = (
      <>
        <p>
          Protocol development is managed by token holders, by participating in semi-annual coin
          votes, which determine protocol upgrades.
        </p>
        <p>
          The community vote is split into two phases, each phase has it’s own snapshot:{' '}
          {!showMore && readButton}
        </p>
      </>
    );

    const moreText = (
      <>
        <ul>
          <li>
            <strong>Proposal Phase</strong>: Proposals which received an aggregated vote weight of
            more than 3% of the outstanding ZP will be considered eligible release candidates in the
            community vote.
          </li>
          <li>
            <strong>Vote Phase</strong>: Vote on the eligible release candidates. The release
            candidate which wins the community vote must be upgraded to prior to the version expiry.
          </li>
        </ul>
        <p>
          The protocol is held under a proprietary{' '}
          <ExternalLink url="https://github.com/zenprotocol/zenprotocol/blob/master/AUTHORIZED_PROTOCOL.pdf">
            open source license
          </ExternalLink>{' '}
          which is designed to force coin holders to reach consensus, rather than bifurcate the
          network. {showMore && readButton}
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
