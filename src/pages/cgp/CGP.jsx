import React from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
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
import HashLink from '../../components/HashLink';

import { getVoteStatus, voteStatus } from './modules/cgpVoteStatus';
import VotesTab from './components/tabs/Votes';
import ResultsTab from './components/tabs/Results';
import IntervalsDropDown from './components/IntervalsDropDown';
import InfoBoxes from './components/InfoBoxes';
import WinnerSummary from './components/WinnerSummary';
import DuringSummary from './components/DuringSummary';
import PageDescription from './components/PageDescription';
import getPhaseName from './modules/getPhaseName';

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
  get phaseRouteParam() {
    const phase = RouterUtils.getRouteParams(this.props).phase;
    return parsePhase(phase);
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
      ...this.cgpStore.relevantInterval,
    });
  }

  /**
   * redirect to the requested interval
   * is called when selecting an interval in the dropdown
   */
  handleIntervalChange({ interval, phase } = {}) {
    if (interval !== this.intervalRouteParam || parsePhase(phase) !== this.phaseRouteParam) {
      this.props.history.push({
        pathname: getPageUrl({ interval, phase }),
      });
    }
  }

  componentDidMount() {
    if (!this.cgpStore.relevantInterval.interval) {
      this.loadRelevantInterval();
    }
    this.reloadIntervalOnBlocksCountChange();
  }

  componentDidUpdate(prevProps) {
    const curInterval = RouterUtils.getRouteParams(this.props).interval;
    const prevInterval = RouterUtils.getRouteParams(prevProps).interval;
    const storeInterval = String(this.cgpStore.relevantInterval.interval);

    const curPhase = RouterUtils.getRouteParams(this.props).phase;
    const prevPhase = RouterUtils.getRouteParams(prevProps).phase;
    const storePhase = String(this.cgpStore.relevantInterval.phase);
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
  reloadIntervalOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        if (this.relevantLoaded) {
          const { snapshot, tally, phase } = this.cgpStore.relevantInterval;
          // eslint-disable-next-line eqeqeq
          if (phase === 'Nomination' && this.currentBlock == snapshot + (tally - snapshot) / 2) {
            // nomination is switched to vote RIGHT NOW
            this.props.history.push({
              pathname: getPageUrl({ interval: this.intervalRouteParam, phase: 'Vote' }),
            });
          } else {
            this.loadRelevantInterval();
          }
        }
      }
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  loadRelevantInterval() {
    this.cgpStore.loadRelevantInterval({
      interval: this.intervalRouteParam,
      phase: this.intervalRouteParam === '0' ? null : this.phaseRouteParam, // do not send phase if we don't know the interval
    });
  }

  render() {
    const redirectToRelevantInterval = this.getRedirectForIntervalZero();
    if (redirectToRelevantInterval) return redirectToRelevantInterval;

    const { infoStore, cgpStore } = this.props.rootStore;

    return (
      <Page className="CGP">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Common Goods Pool')}</title>
        </Helmet>

        <div className="row">
          <div className="col">
            <PageTitle
              title="Common Goods Pool"
              subtitle={
                infoStore.infos.cgpVotingContractAddress ? (
                  <div>
                    <strong>Contract address</strong>:{' '}
                    <HashLink
                      hash={infoStore.infos.cgpFundContractAddress}
                      url={`/contracts/${infoStore.infos.cgpFundContractAddress}`}
                      truncate={false}
                      copy={true}
                    />
                  </div>
                ) : null
              }
            />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mb-3 mb-lg-5">
            <PageDescription intervalLength={cgpStore.intervalLength} />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-8">
            <h4>{getPhaseName(cgpStore.relevantInterval.phase)} phase</h4>
          </div>
          <div className="col-md-4">
            <IntervalsDropDown
              currentBlock={this.currentBlock}
              intervalLength={this.cgpStore.intervalLength}
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

    const { infoStore } = this.props.rootStore;
    const contractAddress = infoStore.infos.cgpFundContractAddress;

    return (
      <>
        <section>
          <InfoBoxes
            voteStatus={this.voteStatus}
            {...relevantInterval}
            currentBlock={this.currentBlock}
            contractAddress={contractAddress}
          />
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
      </>
    );
  }

  renderTabs() {
    if (!this.relevantLoaded) return null;
    const { relevantInterval } = this.cgpStore;
    return this.voteStatus !== voteStatus.before ? (
      <section>
        <VotingTabs
          {...this.props}
          isIntermediate={this.voteStatus === voteStatus.during}
          relevantInterval={relevantInterval}
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
      const interval = this.cgpStore.relevantInterval.interval;
      const phase = this.cgpStore.relevantInterval.phase;
      return <Redirect to={getPageUrl({ interval, phase })} />;
    }
    return null;
  }
}

function VotingTabs({ match, isIntermediate, relevantInterval }) {
  const currentPath = match.path;
  const isNomination = relevantInterval.phase === 'Nomination';
  return (
    <Tabs>
      <TabHead>
        {isNomination ? (
          <>
            <Tab id="votes/nomination">NOMINATION VOTES</Tab>
            <Tab id="results/nomination">{isIntermediate && 'INTERMEDIATE '}NOMINATION RESULTS</Tab>
          </>
        ) : (
          <>
            <Tab id="votes/allocation">ALLOCATION VOTES</Tab>
            <Tab id="results/allocation">{isIntermediate && 'INTERMEDIATE '}ALLOCATION RESULTS</Tab>
            <Tab id="votes/payout">PAYOUT VOTES</Tab>
            <Tab id="results/payout">{isIntermediate && 'INTERMEDIATE '}PAYOUT RESULTS</Tab>
          </>
        )}
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/votes/:type`} component={VotesTab} />
          <Route path={`${currentPath}/results/:type`} component={ResultsTab} />
          <Redirect
            from={`${currentPath}`}
            to={`${currentPath}/votes/${isNomination ? 'nomination' : 'allocation'}`}
          />
        </Switch>
      </TabBody>
    </Tabs>
  );
}
VotingTabs.propTypes = {
  match: PropTypes.any,
  isIntermediate: PropTypes.bool,
  relevantInterval: PropTypes.object,
};

function getPageUrl({ interval, phase } = {}) {
  return `/cgp/${interval}/${phase}/votes/${phase === 'Nomination' ? 'nomination' : 'allocation'}`;
}

/**
 * Parses the phase, make Nomination the default phase
 * @param {string} phase
 * @returns the phase in the right case
 */
function parsePhase(phase) {
  return String(phase).toLowerCase() === 'vote' ? 'Vote' : 'Nomination';
}

export default inject('rootStore')(observer(CGPPage));
