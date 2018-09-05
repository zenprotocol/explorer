import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils.js';
import Loading from '../../components/Loading/Loading.jsx';
import './Info.css';
import '../page.css';

function ContentBox(props) {
  return (
    <div className="col border border-dark">
      <div className={classNames('content-box d-flex align-items-center flex-wrap', props.className)}>
        <div className="content-wrapper d-flex align-items-center">
          <div className="icon text-secondary d-flex align-items-center justify-content-center">
            <i className={props.iconClass} />
          </div>
          <div className="content">
            <div className="title text-secondary">{props.title}</div>
            <div className="value text-white text-monospace">{props.content}</div>
          </div>
        </div>
        {props.children ? <div className="body">{props.children}</div> : null}
      </div>
    </div>
  );
}
ContentBox.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
  className: PropTypes.string,
  iconClass: PropTypes.string,
  children: PropTypes.any,
};

class InfoPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      infos: {},
    };
  }
  componentDidMount() {
    this.fetchInfos();
  }

  fetchInfos() {
    this.setState({ loading: true });
    Service.infos.find().then(result => {
      this.setState({ loading: false, infos: result.data });
    });
  }

  render() {
    if (this.state.loading) {
      return <Loading />;
    }

    if (Object.keys(this.state.infos).length === 0 ) {
      return null;
    }

    const { chain, blocks, transactions, difficulty, nodeVersion, walletVersion } = this.state.infos;

    return (
      <section className="Info container">
        <div className="row">
          <ContentBox className="chain" title="Chain" content={`${TextUtils.capitalize(chain)}net`} iconClass="fal fa-link fa-fw" />
          <ContentBox className="blocks" title="Blocks" content={TextUtils.formatNumber(blocks)} iconClass="fal fa-cubes fa-fw" />
          <ContentBox className="transactions" title="Transactions" content={TextUtils.formatNumber(transactions)} iconClass="fal fa-money-check fa-fw" />
        </div>
        <div className="row">
          <ContentBox className="difficulty" title="Mining difficulty" content={TextUtils.formatNumber(Math.floor(difficulty))} iconClass="fal fa-dumbbell fa-fw" />
          <ContentBox className="hashrate" title="Network Hashrate" content={`${TextUtils.formatNumber(Math.floor(difficulty / 550)/100)} TH/s`} iconClass="fal fa-tachometer-alt-fastest fa-fw" />
        </div>
        <div className="row">
          <ContentBox className="wallet" title="wallet" content={walletVersion} iconClass="fal fa-wallet fa-fw">
            <a
              href="https://docs.zenprotocol.com/preparation/installers"
              className="btn btn-primary-strong"
            >
              Download wallet
            </a>
          </ContentBox>
          <ContentBox className="node" title="Zen node" content={nodeVersion} iconClass="fal fa-server fa-fw">
            <a href="https://docs.zenprotocol.com/headless" className="btn btn-dark-2">
              Download node
            </a>
          </ContentBox>
        </div>
      </section>
    );
  }
}

export default InfoPage;
