import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils.js';
import Loading from '../../components/Loading';
import Button from '../../components/buttons/Button';
import { ChartLoader } from '../../components/charts';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import InfoBox from '../../components/InfoBox';
import './Info.scss';

const FETCH_TIMEOUT = 30000;

class InfoPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFirstLoad: true,
    };

    this.fetchInfos = this.fetchInfos.bind(this);
  }

  get infoStore() {
    return this.props.rootStore.infoStore;
  }

  componentDidMount() {
    // infos should be loaded already from App
    this.fetchTimer = setTimeout(this.fetchInfos, FETCH_TIMEOUT);
  }

  componentWillUnmount() {
    clearTimeout(this.fetchTimer);
  }

  fetchInfos() {
    this.setState({ isFirstLoad: false });
    this.infoStore.loadInfos().then(() => {
      this.fetchTimer = setTimeout(this.fetchInfos, FETCH_TIMEOUT);
    });
  }

  render() {
    if (this.state.isFirstLoad && this.infoStore.loading.infos) {
      return <Loading />;
    }

    const {infos} = this.infoStore;
    if (Object.keys(infos).length === 0) {
      return null;
    }

    const {
      chain,
      blocks,
      transactions,
      difficulty,
      hashRate,
      nodeVersion,
      walletVersion,
    } = infos;

    return (
      <Page className="Info">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Block Explorer - Statistics')}</title>
        </Helmet>
        <PageTitle title="Statistics" />
        <section className="container">
          <div className="row">
            <InfoBox
              className="chain"
              title="Chain"
              content={`${TextUtils.capitalize(addNetToChainName(chain))}`}
              iconClass="fal fa-link fa-fw"
            />
            <InfoBox
              className="blocks"
              title="Blocks"
              content={TextUtils.formatNumber(blocks)}
              iconClass="fal fa-cubes fa-fw"
            />
            <InfoBox
              className="transactions"
              title="Transactions"
              content={TextUtils.formatNumber(transactions)}
              iconClass="fal fa-money-check fa-fw"
            />
          </div>
          <div className="row">
            <InfoBox
              className="difficulty"
              title="Mining difficulty"
              content={TextUtils.formatNumber(Math.floor(difficulty))}
              iconClass="fal fa-dumbbell fa-fw"
            />
            <InfoBox
              className="hashrate"
              title="Network Hashrate"
              content={`${TextUtils.formatNumber((hashRate / 1000000000000).toFixed(2))} TH/s`}
              iconClass="fal fa-tachometer-alt-fastest fa-fw"
            />
          </div>
          <div className="row bg-black-accent">
            <InfoBox
              className="wallet"
              title="zen wallet"
              content={walletVersion}
              iconClass="fal fa-wallet fa-fw"
            >
              <Button href="https://docs.zenprotocol.com/preparation/installers">
                Download wallet
              </Button>
            </InfoBox>
            <InfoBox
              className="node"
              title="Zen node"
              content={nodeVersion}
              iconClass="fal fa-server fa-fw"
            >
              <Button href="https://docs.zenprotocol.com/headless" type="dark-2">
                Download node
              </Button>
            </InfoBox>
          </div>
        </section>
        <section className="charts">
          <h1 className="d-block text-white mb-5">CHARTS</h1>
          <div className="row">
            <div className="col-lg-6">
              <ChartLoader
                chartName="transactionsPerDay"
                showTitle={true}
                titleLinkTo="/charts/transactions"
              />
            </div>
            <div className="col-lg-6">
              <ChartLoader
                chartName="blockDifficulty"
                showTitle={true}
                titleLinkTo="/charts/difficulty"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <ChartLoader
                chartName="networkHashRate"
                showTitle={true}
                titleLinkTo="/charts/hashrate"
              />
            </div>
            <div className="col-lg-6">
              <ChartLoader chartName="zpRichList" showTitle={true} titleLinkTo="/charts/richlist" />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <ChartLoader chartName="zpSupply" showTitle={true} titleLinkTo="/charts/supply" />
            </div>
            <div className="col-lg-6" />
          </div>
        </section>
      </Page>
    );
  }
}

InfoPage.propTypes = {
  rootStore: PropTypes.object,
};

const addNetToChainName = chain => {
  if (!chain || typeof chain !== 'string') {
    return chain;
  }
  const append = 'net';
  return chain.endsWith(append) ? chain : chain + append;
};

export default inject('rootStore')(observer(InfoPage));
