import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { getVoteStatus, voteStatus } from './voteStatus';
import InfoBox from '../../components/InfoBox';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import VotesTab from './components/tabs/Votes';
import ResultsTab from './components/tabs/Results';
import RouterUtils from '../../lib/RouterUtils';
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';
import CommitLink from './components/CommitLink';
import Dropdown from '../../components/Dropdown';
import './Governance.scss';

class GovernancePage extends React.Component {
  constructor(props) {
    super(props);

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }
  get repoVoteStore() {
    return this.props.rootStore.repoVoteStore;
  }
  get currentBlock() {
    return this.props.rootStore.blockStore.blocksCount;
  }
  get intervalRouteParam() {
    const interval = RouterUtils.getRouteParams(this.props).interval;
    return !isNaN(interval) ? interval : '0';
  }
  get relevantLoaded() {
    return this.repoVoteStore.relevantInterval.interval !== undefined;
  }
  get noIntervalsFound() {
    return this.repoVoteStore.relevantInterval.status === 404;
  }
  get voteStatus() {
    return getVoteStatus({
      currentBlock: this.currentBlock,
      beginHeight: this.repoVoteStore.relevantInterval.beginHeight,
      endHeight: this.repoVoteStore.relevantInterval.endHeight,
    });
  }

  /**
   * redirect to the requested interval
   * is called when selecting an interval in the dropdown
   */
  handleIntervalChange(data) {
    const toInterval = data.value;
    if (toInterval !== this.intervalRouteParam) {
      this.props.history.push({
        pathname: getPageUrl(toInterval),
      });
    }
  }

  componentDidMount() {
    this.loadRelevantInterval();

    // load once only
    if (!this.repoVoteStore.recentIntervals.length) {
      this.repoVoteStore.loadRecentIntervals();
    }
  }

  componentDidUpdate(prevProps) {
    const curInterval = RouterUtils.getRouteParams(this.props).interval;
    const prevInterval = RouterUtils.getRouteParams(prevProps).interval;
    if (curInterval !== prevInterval) {
      this.loadRelevantInterval();
    }
  }

  loadRelevantInterval() {
    if (
      !this.repoVoteStore.relevantInterval.interval ||
      String(this.repoVoteStore.relevantInterval.interval) !== this.intervalRouteParam
    ) {
      this.repoVoteStore.loadRelevantInterval({ interval: this.intervalRouteParam });
    }
  }

  render() {
    const redirectToRelevantInterval = this.getRedirectForIntervalZero();
    if (redirectToRelevantInterval) return redirectToRelevantInterval;

    return (
      <Page className="Governance">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Governance')}</title>
        </Helmet>

        <div className="row">
          <div className="col-md-8">
            <PageTitle title="Community Votes" />
          </div>
          <div className="col-md-4">
            <IntervalsDropDown
              relevantInterval={this.repoVoteStore.relevantInterval}
              intervals={this.repoVoteStore.recentIntervals}
              onIntervalChange={this.handleIntervalChange}
            />
          </div>
        </div>

        {this.noIntervalsFound && (
          <section>
            <ItemNotFound item="interval" />
          </section>
        )}

        {this.renderTopData()}
        {this.renderTabs()}
      </Page>
    );
  }

  renderTopData() {
    const relevantInterval = this.repoVoteStore.relevantInterval;
    if (this.repoVoteStore.loading.interval) return <Loading />;
    if (!this.relevantLoaded) return null;

    return (
      <div>
        <section>
          {this.voteStatus === voteStatus.before && (
            <BeforeVoteInfo {...relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.during && (
            <DuringVoteInfo {...relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.after && (
            <AfterVoteInfo
              {...relevantInterval}
              currentBlock={this.currentBlock}
              commitId={this.repoVoteStore.winnerCommitId}
            />
          )}
        </section>
      </div>
    );
  }

  renderTabs() {
    if (!this.relevantLoaded) return null;
    return this.voteStatus !== voteStatus.before ? (
      <section>
        <VotingTabs {...this.props} isIntermediate={this.voteStatus === voteStatus.during} />
      </section>
    ) : null;
  }

  /**
   * redirect to current interval if already loaded and interval is 0
   */
  getRedirectForIntervalZero() {
    const routeInterval = this.intervalRouteParam;
    if (routeInterval === '0' && this.relevantLoaded) {
      const interval = this.repoVoteStore.relevantInterval.interval;
      return <Redirect to={getPageUrl(interval)} />;
    }
    return null;
  }
}

function BeforeVoteInfo({ currentBlock, beginHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(beginHeight)}
          iconClass="fal fa-cubes fa-fw"
        />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          VOTE BEGINS IN {TextUtils.formatNumber(beginHeight - currentBlock)} BLOCKS
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  beginHeight: PropTypes.number,
};

function DuringVoteInfo({ currentBlock, endHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(endHeight)}
          iconClass="fal fa-money-check fa-fw"
        />
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  endHeight: PropTypes.number,
};

function AfterVoteInfo({ commitId, beginHeight, endHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(beginHeight)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(endHeight)}
          iconClass="fal fa-money-check fa-fw"
        />
      </div>
      {commitId && (
        <div className="row">
          <div className="col border border-dark text-center after-tally-message">
            WINNER: <CommitLink commitId={commitId} />
          </div>
        </div>
      )}
    </div>
  );
}
AfterVoteInfo.propTypes = {
  beginHeight: PropTypes.number,
  endHeight: PropTypes.number,
  commitId: PropTypes.string,
};

function VotingTabs({ match, isIntermediate }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="tally">{isIntermediate && 'INTERMEDIATE '}RESULTS</Tab>
        <Tab id="votes">VOTES</Tab>
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/tally`} component={ResultsTab} />
          <Route path={`${currentPath}/votes`} component={VotesTab} />
          <Redirect from={`${currentPath}`} to={`${currentPath}/tally`} />
        </Switch>
      </TabBody>
    </Tabs>
  );
}
VotingTabs.propTypes = {
  match: PropTypes.any,
  isIntermediate: PropTypes.bool,
};

function IntervalsDropDown({ relevantInterval, intervals, onIntervalChange }) {
  if (!(relevantInterval || {}).interval) return null;

  const options = intervals.map(item => ({
    value: String(item.interval),
    label: `${TextUtils.getOrdinal(item.interval)} Semester - ${item.beginHeight}-${
      item.endHeight
    }`,
  }));
  return (
    <Dropdown
      options={options}
      value={String(relevantInterval.interval)}
      onChange={onIntervalChange}
    />
  );
}
IntervalsDropDown.propTypes = {
  relevantInterval: PropTypes.object,
  intervals: PropTypes.array.isRequired,
  onIntervalChange: PropTypes.func,
};

function getPageUrl(interval) {
  return `/governance/${interval}`;
}

export default inject('rootStore')(observer(GovernancePage));
