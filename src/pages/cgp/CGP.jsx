import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';

import TextUtils from '../../lib/TextUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import RouterUtils from '../../lib/RouterUtils';
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';

import { getVoteStatus, voteStatus } from './cgpVoteStatus';
import VotesTab from './components/tabs/Votes';
import ResultsTab from './components/tabs/Results';
import IntervalsDropDown from './components/IntervalsDropDown';
import { AfterVoteInfo, BeforeVoteInfo, DuringVoteInfo } from './components/InfoBoxes';
import WinnerSummary from './components/WinnerSummary';

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
      <>
        <section>
          {this.voteStatus === voteStatus.before && (
            <BeforeVoteInfo {...relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.during && (
            <DuringVoteInfo {...relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.after && <AfterVoteInfo {...relevantInterval} />}
        </section>
        {this.voteStatus === voteStatus.after && (
          <section>
            <WinnerSummary {...relevantInterval} />
          </section>
        )}
      </>
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

function VotingTabs({ match, isIntermediate }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="votes/allocation">ALLOCATION VOTES</Tab>
        <Tab id="tally/allocation">{isIntermediate && 'INTERMEDIATE '}ALLOCATION RESULTS</Tab>
        <Tab id="votes/payout">PAYOUT VOTES</Tab>
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

function getPageUrl(interval) {
  return `/cgp/${interval}`;
}

export default inject('rootStore')(observer(CGPPage));
