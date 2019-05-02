import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Link, Route, Switch, Redirect } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { getVoteStatus, voteStatus } from './voteStatus';
import InfoBox from '../../components/InfoBox';
import CommitLink from './components/CommitLink';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import VotesTab from './components/tabs/Votes';
import RouterUtils from '../../lib/RouterUtils';
import './Governance.scss';

class GovernancePage extends React.Component {
  get repoVoteStore() {
    return this.props.rootStore.repoVoteStore;
  }
  get intervalRouteParam() {
    return RouterUtils.getRouteParams(this.props).interval;
  }
  componentDidMount() {
    // do not load again if data already loaded
    if (!this.repoVoteStore.tally.interval) {
      this.repoVoteStore.loadTally({interval: this.intervalRouteParam});
    }
  }
  render() {
    const tally = this.repoVoteStore.tally;

    if (!tally.interval) {
      return null;
    }

    const redirectToCurrentInterval = this.getRedirectForIntervalZero(tally);
    if (redirectToCurrentInterval) return redirectToCurrentInterval;

    const voteInProgress = false;
    const status = getVoteStatus(tally);

    return (
      <Page className="Vote">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Governance')}</title>
        </Helmet>
        <section>
          <PageTitle title="VOTE ON THE AUTHORIZED PROTOCOL" />
          {status === voteStatus.before ? (
            <BeforeVoteInfo {...tally} />
          ) : (
            <div className="row">
              <div className="col-lg-6">
                <div>
                  <SummaryTable vote={tally} voteInProgress={voteInProgress} />
                </div>
              </div>
              <div className="col-lg-6">
                <div>
                  <TallyTable {...tally} />
                </div>
              </div>
            </div>
          )}
        </section>
        {status !== voteStatus.before && (
          <section>
            <VotingTabs {...this.props} />
          </section>
        )}
      </Page>
    );
  }

  /**
   * redirect to current interval if exists and interval is 0
   */
  getRedirectForIntervalZero(tally) {
    const routeInterval = this.intervalRouteParam;
    if (routeInterval === '0') {
      return <Redirect to={`/governance/${tally.interval}`} />;
    }
    return null;
  }
}

function BeforeVoteInfo({ currentBlock, beginHeight, endHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          className="current-block"
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cubes fa-fw"
        />
        <InfoBox
          className="begin-height"
          title="Snapshot Block"
          content={TextUtils.formatNumber(beginHeight)}
          iconClass="fal fa-cubes fa-fw"
        />
        <InfoBox
          className="end-height"
          title="Tally Block"
          content={TextUtils.formatNumber(endHeight)}
          iconClass="fal fa-money-check fa-fw"
        />
      </div>
      <div className="row">
        <div className="col border border-dark text-center vote-after-snapshot">
          VOTE AFTER SNAPSHOT
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  beginHeight: PropTypes.number,
  endHeight: PropTypes.number,
};

function SummaryTable({ vote }) {
  const { currentBlock, beginHeight, endHeight } = vote;
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col" colSpan="2">
            SUMMARY
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CURRENT BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${currentBlock}`}>{currentBlock}</Link>
          </td>
        </tr>
        <tr>
          <td>NEXT SNAPSHOT BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${beginHeight}`}>{beginHeight}</Link>
          </td>
        </tr>
        <tr>
          <td>TALLY BLOCK</td>
          <td className="text-right">
            <Link to={`/blocks/${endHeight}`}>{endHeight}</Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
SummaryTable.propTypes = {
  vote: PropTypes.object,
  voteInProgress: PropTypes.bool,
};

function TallyTable({ tally }) {
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th colSpan="2">TALLY</th>
        </tr>
        <tr>
          <th scope="col">COMMIT ID</th>
          <th scope="col" className="text-right">
            VOTES
          </th>
        </tr>
      </thead>
      <tbody>
        {tally.map(vote => (
          <tr key={vote.commitId}>
            <td>
              <CommitLink commitId={vote.commitId} />
            </td>
            <td className="text-right">{TextUtils.formatNumber(vote.zpAmount)} ZP</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
TallyTable.propTypes = {
  tally: PropTypes.array,
};

function VotingTabs({ match }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="votes">VOTES</Tab>
        <Tab id="code">CONTRACT CODE</Tab>
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/votes`} component={VotesTab} />
          <Route path={`${currentPath}/code`} component={VotesTab} />
          <Redirect from={`${currentPath}`} to={`${currentPath}/votes`} />
        </Switch>
      </TabBody>
    </Tabs>
  );
}

export default inject('rootStore')(observer(GovernancePage));
