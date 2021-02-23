import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import ObjectUtils from '../../lib/ObjectUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { getVoteStatus, voteStatus } from './voteStatus';
import InfoBox from '../../components/InfoBox';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import VotesTab from './components/tabs/Votes';
import ResultsTab from './components/tabs/Results';
import RouterUtils from '../../lib/RouterUtils';
import calcTimeRemaining from '../../lib/calcTimeRemaining';
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';
import Dropdown from '../../components/Dropdown';
import PageDescription from './components/PageDescription';
import DuringSummary from './components/DuringSummary';
import WinnerSummary from './components/WinnerSummary';
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
  get phaseRouteParam() {
    const phase = RouterUtils.getRouteParams(this.props).phase;
    return ['contestant', 'candidate'].indexOf(phase.toLowerCase()) > -1 ? phase : 'Contestant';
  }
  get relevantLoaded() {
    return this.repoVoteStore.relevantInterval.interval;
  }
  get noIntervalsFound() {
    return this.repoVoteStore.relevantInterval.status === 404;
  }
  get voteStatus() {
    return getVoteStatus({
      currentBlock: this.currentBlock,
      beginBlock: this.repoVoteStore.relevantInterval.beginBlock,
      endBlock: this.repoVoteStore.relevantInterval.endBlock,
    });
  }

  /**
   * redirect to the requested interval
   * is called when selecting an interval in the dropdown
   */
  handleIntervalChange(data) {
    const { interval, phase } = intervalsDDParseValue(data.value);
    if (interval !== this.intervalRouteParam || phase !== this.phaseRouteParam) {
      this.props.history.push({
        pathname: getPageUrl(interval, phase),
      });
    }
  }

  componentDidMount() {
    if (!this.repoVoteStore.relevantInterval.interval) {
      this.loadRelevantInterval();
    }

    // load once only
    if (!this.repoVoteStore.recentIntervals.length) {
      this.repoVoteStore.loadRecentIntervals();
    }

    this.reloadOnBlocksCountChange();
  }

  componentDidUpdate(prevProps) {
    const curInterval = RouterUtils.getRouteParams(this.props).interval;
    const curPhase = RouterUtils.getRouteParams(this.props).phase;
    const prevInterval = RouterUtils.getRouteParams(prevProps).interval;
    const prevPhase = RouterUtils.getRouteParams(prevProps).phase;
    const storeInterval = String(this.repoVoteStore.relevantInterval.interval);
    const storePhase = String(this.repoVoteStore.relevantInterval.phase);
    if (
      (curInterval !== prevInterval && storeInterval !== curInterval) ||
      (curPhase !== prevPhase && storePhase !== curPhase)
    ) {
      this.loadRelevantInterval();
    }
  }

  componentWillUnmount() {
    this.stopReload();
  }
  /**
   * Must reload interval to get winner
   */
  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.loadRelevantInterval()
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  loadRelevantInterval() {
    this.repoVoteStore.loadRelevantInterval({
      interval: this.intervalRouteParam,
      phase: this.phaseRouteParam,
    });
  }

  render() {
    const redirectToRelevantInterval = this.getRedirectForIntervalZero();
    if (redirectToRelevantInterval) return redirectToRelevantInterval;

    const isContestantsPhase =
      (
        ObjectUtils.getSafeProp(this.repoVoteStore, 'relevantInterval.phase') || ''
      ).toLowerCase() === 'contestant';

    return (
      <Page className="Governance">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Governance')}</title>
        </Helmet>

        <div className="row">
          <div className="col-md-8">
            <PageTitle title="Community Votes" />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-3 mb-lg-5">
            <PageDescription />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-8">
            <h4>
              {!this.noIntervalsFound &&
                `${isContestantsPhase ? 'Contestants' : 'Candidates'} phase`}
            </h4>
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
    const { relevantInterval } = this.repoVoteStore;
    if (this.repoVoteStore.loading.relevantInterval) {
      return <Loading />;
    }
    if (!this.relevantLoaded) return null;

    return (
      <div>
        <section>
          {this.voteStatus === voteStatus.before && (
            <BeforeVoteInfo relevantInterval={relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.during && (
            <DuringVoteInfo relevantInterval={relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.after && (
            <AfterVoteInfo relevantInterval={relevantInterval} />
          )}
        </section>
        {this.voteStatus === voteStatus.during && (
          <section>
            <DuringSummary {...relevantInterval} currentBlock={this.currentBlock} />
          </section>
        )}
        {this.voteStatus === voteStatus.after && (
          <section>
            <WinnerSummary {...relevantInterval} currentBlock={this.currentBlock} />
          </section>
        )}
      </div>
    );
  }

  renderTabs() {
    if (!this.relevantLoaded) return null;
    const { relevantInterval } = this.repoVoteStore;
    return this.voteStatus !== voteStatus.before ? (
      <section>
        <VotingTabs
          {...this.props}
          isIntermediate={this.voteStatus === voteStatus.during}
          isContestant={relevantInterval.phase === 'Contestant'}
        />
      </section>
    ) : null;
  }

  /**
   * redirect to current interval if already loaded and interval is 0
   */
  getRedirectForIntervalZero() {
    const routeInterval = this.intervalRouteParam;
    if (routeInterval === '0' && this.relevantLoaded) {
      const { interval, phase } = this.repoVoteStore.relevantInterval;
      return <Redirect to={getPageUrl(interval, phase)} />;
    }
    return null;
  }
}

function BeforeVoteInfo({ currentBlock, relevantInterval }) {
  const blocksToStart = relevantInterval.beginBlock - currentBlock;
  const timeRemaining = calcTimeRemaining(blocksToStart);

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
          content={TextUtils.formatNumber(relevantInterval.beginBlock)}
          iconClass="fal fa-cubes fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(relevantInterval.endBlock)}
          iconClass="fal fa-cubes fa-fw"
        />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          VOTE BEGINS IN {TextUtils.formatNumber(blocksToStart)}{' '}
          {blocksToStart > 1 ? 'BLOCKS' : 'BLOCK'}, ~ {timeRemaining}
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  relevantInterval: PropTypes.object,
};

function DuringVoteInfo({ currentBlock, relevantInterval }) {
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
          content={TextUtils.formatNumber(relevantInterval.endBlock)}
          iconClass="fal fa-money-check fa-fw"
        />
        {relevantInterval.phase === 'Contestant' && (
          <InfoBox
            title="Threshold"
            content={`${AssetUtils.getAmountDivided(relevantInterval.threshold)}`}
            iconClass="fal fa-coins fa-fw"
          />
        )}
      </div>
      <div className="row">
        <div className="col border border-dark text-center during-vote-message">VOTE IS OPEN</div>
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  relevantInterval: PropTypes.object,
};

function AfterVoteInfo({ relevantInterval }) {
  const { beginBlock, endBlock } = relevantInterval;

  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(beginBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(endBlock)}
          iconClass="fal fa-money-check fa-fw"
        />
        {relevantInterval.phase === 'Contestant' && (
          <InfoBox
            title="Threshold"
            content={AssetUtils.getAmountDivided(relevantInterval.threshold)}
            iconClass="fal fa-coins fa-fw"
          />
        )}
      </div>
    </div>
  );
}
AfterVoteInfo.propTypes = {
  relevantInterval: PropTypes.object,
};

function VotingTabs({ match, isIntermediate, isContestant }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="votes">VOTES</Tab>
        <Tab id={`results/${isContestant ? 'contestant' : 'candidate'}`}>
          {isIntermediate && 'INTERMEDIATE '}RESULTS
        </Tab>
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/votes`} component={VotesTab} />
          <Route path={`${currentPath}/results/:phase`} component={ResultsTab} />
          <Redirect from={`${currentPath}/results`} to={`${currentPath}/results/contestant`} />
          <Redirect from={`${currentPath}`} to={`${currentPath}/votes`} />
        </Switch>
      </TabBody>
    </Tabs>
  );
}
VotingTabs.propTypes = {
  match: PropTypes.any,
  isIntermediate: PropTypes.bool,
  isContestant: PropTypes.bool,
};

function IntervalsDropDown({ relevantInterval, intervals, onIntervalChange }) {
  if (!(relevantInterval || {}).interval) return null;

  const options = intervals.map((item) => ({
    value: intervalsDDCreateValue(item),
    label: getDropDownSemesterText(item),
  }));

  let value = intervalsDDCreateValue(relevantInterval);
  if (!options.find((option) => option.value === value)) {
    value = getDropDownSemesterText(relevantInterval);
  }

  return <Dropdown options={options} value={value} onChange={onIntervalChange} />;
}
IntervalsDropDown.propTypes = {
  relevantInterval: PropTypes.object,
  intervals: PropTypes.array.isRequired,
  onIntervalChange: PropTypes.func,
};

function getDropDownSemesterText(interval) {
  return `${TextUtils.getOrdinal(interval.interval)} Semester, ${
    interval.phase
  }s - ${TextUtils.formatNumber(interval.beginBlock)}-${TextUtils.formatNumber(interval.endBlock)}`;
}

function getPageUrl(interval, phase) {
  return `/governance/${interval}/${phase}`;
}

function intervalsDDCreateValue(voteInterval) {
  return `${voteInterval.interval} ${voteInterval.phase}`;
}
function intervalsDDParseValue(value) {
  const parsed = value.split(' ');
  return {
    interval: Number(parsed[0]),
    phase: parsed[1],
  };
}

export default inject('rootStore')(observer(GovernancePage));
