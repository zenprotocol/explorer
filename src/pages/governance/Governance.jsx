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
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';
import './Governance.scss';

class GovernancePage extends React.Component {
  get repoVoteStore() {
    return this.props.rootStore.repoVoteStore;
  }
  get intervalRouteParam() {
    return RouterUtils.getRouteParams(this.props).interval;
  }
  get tallyLoaded() {
    return this.repoVoteStore.tally.interval !== undefined;
  }
  get voteStatus() {
    return getVoteStatus(this.repoVoteStore.tally);
  }
  componentDidMount() {
    // do not load again if data already loaded
    if (!this.repoVoteStore.tally.interval) {
      this.repoVoteStore.loadTally({ interval: this.intervalRouteParam });
    }
  }
  render() {
    const tally = this.repoVoteStore.tally;

    const redirectToCurrentInterval = this.getRedirectForIntervalZero(tally);
    if (redirectToCurrentInterval) return redirectToCurrentInterval;

    return (
      <Page className="Vote">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Governance')}</title>
        </Helmet>
        <section>
          <PageTitle title="VOTE ON THE AUTHORIZED PROTOCOL" />
          {tally.status === 404 && <ItemNotFound item="interval" />}
          {this.renderTopData()}
        </section>
        {this.renderTabs()}
      </Page>
    );
  }

  renderTopData() {
    const tally = this.repoVoteStore.tally;
    if (this.repoVoteStore.loading.interval) return <Loading />;
    if (!this.tallyLoaded) return null;
    return this.voteStatus === voteStatus.before ? (
      <BeforeVoteInfo {...tally} />
    ) : (
      <VoteInfo {...tally} />
    );
  }

  renderTabs() {
    if (!this.tallyLoaded) return null;
    return this.voteStatus !== voteStatus.before ? (
      <section>
        <VotingTabs {...this.props} />
      </section>
    ) : null;
  }

  /**
   * redirect to current interval if exists and interval is 0
   */
  getRedirectForIntervalZero(tally) {
    const routeInterval = this.intervalRouteParam;
    if (routeInterval === '0' && this.tallyLoaded) {
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

function VoteInfo(tally) {
  return (
    <div className="row">
      <div className="col-lg-6">
        <div>
          <SummaryTable {...tally} />
        </div>
      </div>
      <div className="col-lg-6">
        <div>
          <TallyTable {...tally} />
        </div>
      </div>
    </div>
  );
}

function SummaryTable({ currentBlock, beginHeight, endHeight }) {
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
  currentBlock: PropTypes.number,
  beginHeight: PropTypes.number,
  endHeight: PropTypes.number,
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
