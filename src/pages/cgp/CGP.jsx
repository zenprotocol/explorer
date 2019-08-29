import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { getVoteStatus, voteStatus } from './cgpVoteStatus';
import InfoBox from '../../components/InfoBox';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import VotesTab from './components/tabs/Votes';
import ResultsTab from './components/tabs/Results';
import RouterUtils from '../../lib/RouterUtils';
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';
import Dropdown from '../../components/Dropdown';
import './CGP.scss';

class CGPPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }
  get cgpStore() {
    return this.props.rootStore.cgpStore;
  }
  get currentBlock() {
    return this.props.rootStore.blockStore.blocksCount;
  }
  get intervalRouteParam() {
    const interval = RouterUtils.getRouteParams(this.props).interval;
    return !isNaN(interval) ? interval : '0';
  }
  get relevantLoaded() {
    return this.cgpStore.relevantInterval.interval !== undefined;
  }
  get noIntervalsFound() {
    return this.cgpStore.relevantInterval.status === 404;
  }
  get voteStatus() {
    return getVoteStatus({
      currentBlock: this.currentBlock,
      snapshot: this.cgpStore.relevantInterval.snapshot,
      tally: this.cgpStore.relevantInterval.tally,
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
    if (!this.cgpStore.relevantInterval.interval) {
      this.loadRelevantInterval();
    }
  }

  componentDidUpdate(prevProps) {
    const curInterval = RouterUtils.getRouteParams(this.props).interval;
    const prevInterval = RouterUtils.getRouteParams(prevProps).interval;
    const storeInterval = String(this.cgpStore.relevantInterval.interval);
    if (curInterval !== prevInterval && storeInterval !== curInterval) {
      this.loadRelevantInterval();
    }
  }

  loadRelevantInterval() {
    this.cgpStore.loadRelevantInterval({ interval: this.intervalRouteParam });
  }

  render() {
    const redirectToRelevantInterval = this.getRedirectForIntervalZero();
    if (redirectToRelevantInterval) return redirectToRelevantInterval;
    return (
      <Page className="CGP">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Common Goods Pool')}</title>
        </Helmet>

        <div className="row">
          <div className="col-md-8">
            <PageTitle title="Common Goods Pool" />
          </div>
          <div className="col-md-4">
            <IntervalsDropDown
              currentInterval={this.cgpStore.currentInterval}
              relevantInterval={this.cgpStore.relevantInterval}
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
    const relevantInterval = this.cgpStore.relevantInterval;
    if (this.cgpStore.loading.relevantInterval) return <Loading />;
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
            <AfterVoteInfo {...relevantInterval} commitId={this.cgpStore.winnerCommitId} />
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
      const interval = this.cgpStore.relevantInterval.interval;
      return <Redirect to={getPageUrl(interval)} />;
    }
    return null;
  }
}

function CgpBalanceInfoBox({ cgpBalance }) {
  const zpBalance = cgpBalance.find(item => AssetUtils.isZP(item.asset)) || {
    asset: '00',
    amount: '0',
  };
  const allAssetsString = cgpBalance.reduce((all, cur) => {
    const currentAsset = TextUtils.truncateHash(AssetUtils.getAssetNameFromCode(cur.asset));
    const currentDisplay = `${currentAsset}: ${AssetUtils.getAmountString(cur.asset, cur.amount)}`;
    return !all ? currentDisplay : `${all}\n${currentDisplay}`;
  }, '');
  return (
    <InfoBox
      title="Funds In CGP"
      content={
        <div title={allAssetsString}>
          {AssetUtils.getAmountString(zpBalance.asset, zpBalance.amount)}
        </div>
      }
      iconClass="fal fa-coins fa-fw"
    />
  );
}
CgpBalanceInfoBox.propTypes = {
  cgpBalance: PropTypes.array,
};
CgpBalanceInfoBox.defaultProps = {
  cgpBalance: [],
};

function BeforeVoteInfo({ currentBlock, snapshot, ...props }) {
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
          content={TextUtils.formatNumber(snapshot)}
          iconClass="fal fa-cubes fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          VOTE BEGINS IN {TextUtils.formatNumber(snapshot - currentBlock)} BLOCKS
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
};

function DuringVoteInfo({ currentBlock, tally, ...props }) {
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
          content={TextUtils.formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  tally: PropTypes.number,
};

function AfterVoteInfo({ winnerAllocation, winnerPayout, interval, snapshot, tally, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={TextUtils.formatNumber(snapshot)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} />
      </div>
      {/* {winnerAllocation && (
        <div className="row">
          <div className="col border border-dark text-center after-tally-message">
            {TextUtils.getOrdinal(interval).toUpperCase()} SEMESTER WINNER COMMIT ID:
            <br />
            <CommitLink commitId={commitId} />
          </div>
        </div>
      )} */}
    </div>
  );
}
AfterVoteInfo.propTypes = {
  interval: PropTypes.number,
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  winnerAllocation: PropTypes.object,
  winnerPayout: PropTypes.object,
};

function VotingTabs({ match, isIntermediate }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="votes/allocation">ALLOCATION VOTES</Tab>
        <Tab id="votes/payout">PAYOUT VOTES</Tab>
        <Tab id="tally/allocation">{isIntermediate && 'INTERMEDIATE '}ALLOCATION RESULTS</Tab>
        <Tab id="tally/payout">{isIntermediate && 'INTERMEDIATE '}PAYOUT RESULTS</Tab>
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/votes/:type`} component={VotesTab} />
          <Route path={`${currentPath}/tally/:type`} component={ResultsTab} />
          <Redirect from={`${currentPath}`} to={`${currentPath}/votes/allocation`} />
        </Switch>
      </TabBody>
    </Tabs>
  );
}
VotingTabs.propTypes = {
  match: PropTypes.any,
  isIntermediate: PropTypes.bool,
};

function IntervalsDropDown({ relevantInterval, currentInterval, onIntervalChange }) {
  if (!(relevantInterval || {}).interval) return null;

  let intervals = [relevantInterval.interval];
  for (let i = 1; i < 5; i++) {
    // interval below
    if (relevantInterval.interval - i > 0) {
      intervals = [relevantInterval.interval - i, ...intervals];
    }
    // above
    if (relevantInterval.interval + i <= currentInterval) {
      intervals = [...intervals, relevantInterval.interval + i];
    }
  }

  const options = intervals.map(interval => {
    return {
      value: String(interval),
      label: `${TextUtils.getOrdinal(interval)} Semester`,
    };
  });
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
  currentInterval: PropTypes.number.isRequired,
  onIntervalChange: PropTypes.func,
};

function getPageUrl(interval) {
  return `/cgp/${interval}`;
}

export default inject('rootStore')(observer(CGPPage));
