import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import TextUtils from '../../lib/TextUtils.js';
import Loading from '../../components/Loading/Loading.jsx';
import './Info.css';
import '../page.css';

function ContentBox(props) {
  return (
    <div className="col border border-dark">
      <div className="content-box d-flex align-items-center">
        <div className="icon mr-4 text-secondary">
          <i className={props.iconClass} />
        </div>
        <div className="content">
          <div className="title text-secondary">{props.title}</div>
          <div className="value text-white text-monospace">{props.content}</div>
        </div>
        {props.children ? <div className="body ml-4">{props.children}</div> : null}
      </div>
    </div>
  );
}
ContentBox.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
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

    const { chain, blocks, transactions, difficulty, nodeVersion, walletVersion } = this.state.infos;

    return (
      <section className="Info">
        <div className="row">
          <ContentBox title="Chain" content={`${chain}net`} iconClass="fal fa-cubes chain" />
          <ContentBox title="Blocks" content={TextUtils.formatNumber(blocks)} iconClass="fal fa-cube blocks" />
          <ContentBox title="Transactions" content={TextUtils.formatNumber(transactions)} iconClass="fal fa-money-check" />
        </div>
        <div className="row">
          <ContentBox title="Mining difficulty" content={TextUtils.formatNumber(difficulty)} iconClass="fal fa-tachometer-alt-fastest" />
          <ContentBox title="Network Hashrate" content={TextUtils.formatNumber(difficulty / 55)} iconClass="fal fa-fire" />
        </div>
        <div className="row">
          <ContentBox title="wallet" content={walletVersion} iconClass="fas fa-user-friends">
            <a
              href="https://docs.zenprotocol.com/preparation/installers"
              className="btn btn-primary-strong"
            >
              Download wallet
            </a>
          </ContentBox>
          <ContentBox title="Zen node" content={nodeVersion} iconClass="fas fa-user-friends">
            <a href="https://docs.zenprotocol.com/headless" className="btn btn-dark">
              Download node
            </a>
          </ContentBox>
        </div>
      </section>
    );
  }
}

export default InfoPage;
