import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import BlockTxsTable from './BlockTxsTable';
import BlockContractsTable from './BlockContractsTable';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import Page from '../../components/Page';
import ItemNotFound from '../../components/ItemNotFound';
import './Block.scss';

class BlockPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      blockNumber: 0,
    };
  }

  get blockStore() {
    return this.props.rootStore.blockStore;
  }

  get uiStore() {
    return this.props.rootStore.uiStore;
  }

  componentDidMount() {
    this.fetchBlock();
    this.setBlockInUiBlockTxsTable(this.hashOrBlockNumber);
  }

  componentDidUpdate(prevProps) {
    const prevHashOrBlockNumber = RouterUtils.getRouteParams(prevProps).id;
    if (this.hashOrBlockNumber !== prevHashOrBlockNumber) {
      this.fetchBlock();
      this.setBlockInUiBlockTxsTable(this.hashOrBlockNumber);
    }
  }

  fetchBlock() {
    this.blockStore.fetchBlock(this.hashOrBlockNumber).then((block) => {
      this.switchBlock(block.blockNumber);
      this.setBlockInUiBlockContractsTable(block.blockNumber);
    });
  }

  get hashOrBlockNumber() {
    return RouterUtils.getRouteParams(this.props).id;
  }

  setBlockInUiBlockTxsTable(hashOrBlockNumber) {
    this.uiStore.setBlockTxTableData({ hashOrBlockNumber });
  }

  setBlockInUiBlockContractsTable(blockNumber) {
    this.uiStore.setBlockContractsTableData({ blockNumber });
  }

  switchBlock(blockNumber) {
    this.setState({ blockNumber: Number(blockNumber) });
  }

  render() {
    const block = this.blockStore.block;
    const blockNumberStr = block.blockNumber
      ? `#${TextUtils.formatNumber(block.blockNumber)}`
      : this.hashOrBlockNumber;
    const is404 = block.status === 404;
    const renderContent = !is404 && block.blockNumber;
    const hasContracts = this.blockStore.blockContractsCount > 0;

    if (this.blockStore.loading.block) return <Loading />;

    return (
      <Page className="Block">
        <Helmet>
          <title>
            {TextUtils.getHtmlTitle(
              'Block',
              block.blockNumber ? `${block.blockNumber} / ${block.hash}` : ''
            )}
          </title>
        </Helmet>
        <section>
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                BLOCK {blockNumberStr}
              </h1>
            </div>
            <div className="col-sm">{renderContent && this.renderPagination()}</div>
          </div>
          {is404 && <ItemNotFound item="block" />}
          {renderContent && this.renderTopTables()}
        </section>

        <section>{renderContent && <BlockTxsTable />}</section>
        <section>{renderContent && hasContracts && <BlockContractsTable />}</section>
      </Page>
    );
  }

  renderPagination() {
    const { blockNumber } = this.state;
    let prevDisabled = blockNumber <= 1;
    let nextDisabled = blockNumber >= this.blockStore.blocksCount;

    return (
      <nav aria-label="Page navigation" className="float-sm-right">
        <ul className="pagination pagination-sm">
          <li className={classNames('page-item', { disabled: prevDisabled })}>
            <Link
              className="page-link"
              onClick={() => {
                this.switchBlock(blockNumber - 1);
              }}
              to={`/blocks/${blockNumber - 1}`}
            >
              PREVIOUS
            </Link>
          </li>
          <li className="page-item disabled">
            <div className="page-link bg-transparent border-0">
              BLOCK {TextUtils.formatNumber(blockNumber)}
            </div>
          </li>
          <li className={classNames('page-item', { disabled: nextDisabled })}>
            <Link
              className="page-link"
              onClick={() => {
                this.switchBlock(blockNumber + 1);
              }}
              to={`/blocks/${blockNumber + 1}`}
            >
              NEXT
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  renderTopTables() {
    const block = this.blockStore.block;
    const blockDateStr = block.timestamp
      ? TextUtils.getDateStringFromTimestamp(block.timestamp)
      : '';
    const confirmations = Math.max(
      0,
      Number(this.blockStore.blocksCount) - Number(block.blockNumber) + 1
    );

    return (
      <div className="row">
        <div className="col">
          <table className="table table-zen">
            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  SUMMARY
                </th>
              </tr>
            </thead>
            <tbody>
              {block.hash ? (
                <tr>
                  <td>HASH</td>
                  <td className="no-text-transform">
                    <HashLink hash={block.hash} truncate={false} />
                  </td>
                </tr>
              ) : null}
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(block.transactionCount)}</td>
              </tr>
              <tr>
                <td>TIMESTAMP</td>
                <td>{blockDateStr}</td>
              </tr>
              <tr>
                <td>VERSION</td>
                <td>{block.version}</td>
              </tr>
              <tr>
                <td>DIFFICULTY</td>
                <td className="no-text-transform">{TextUtils.formatNumber(block.difficulty)}</td>
              </tr>
              <tr>
                <td>CONFIRMATIONS</td>
                <td className="no-text-transform">
                  {TextUtils.formatNumber(confirmations)}
                </td>
              </tr>
              <tr>
                <td>PARENT</td>
                <td>
                  <div className="address no-text-transform break-word">
                    <HashLink
                      url={block.blockNumber > 1 ? `/blocks/${block.parent}` : ''}
                      hash={block.parent}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

BlockPage.propTypes = {
  match: PropTypes.object,
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(BlockPage));
