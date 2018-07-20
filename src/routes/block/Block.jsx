import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import cx from 'classnames'; // just a convention we use in the wallet, shorter :)
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import TextUtils from '../../lib/TextUtils';
import Transactions from '../../components/Transactions/Transactions.jsx';
import BlockUtils from '../../lib/BlockUtils';
import Loading from '../../components/Loading/Loading.jsx';
import './Block.css';

class BlockPage extends Component {
  static propTypes = {
    match: PropTypes.object,
  };
  state = {
    blockNumber: this.propId,
  };
  componentDidMount() {
    blockStore.fetchBlock(this.propId);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.propId !== Number(prevProps.match.params.id)) {
      blockStore.fetchBlock(this.propId);
    }
  }
  get propId() { // maybe you have idea for better name ...
    return Number(this.props.match.params.id)
  }
  renderPagination() {
    const {blockNumber} = this.state;
    let prevDisabled = blockNumber <= 1;
    let nextDisabled = blockNumber >= blockStore.blocksCount;

    return (
      <nav aria-label="Page navigation" className="float-sm-right">
        <ul className="pagination pagination-sm">
          <li className={cx('page-item', { disabled: prevDisabled })}>
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
            <a className="page-link bg-transparent border-0">BLOCK {blockNumber}</a>
          </li>
          <li className={cx('page-item', { disabled: nextDisabled })}>
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

  switchBlock(blockNumber) {
    this.setState({ blockNumber });
  }

  render() {
    const block = blockStore.block;
    // can make the logic handling in the store to separate concerns, so ideally 
    // component only deals with rendering
    const blockDateStr = block.timestamp ? TextUtils.getDateString(new Date(Number(block.timestamp))) : '';

    if (!block.id) return <Loading />;

    return (
      <div className="Block">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2">{blockDateStr}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                BLOCK #{block.blockNumber}
              </h1>
            </div>
            <div className="col-sm">{this.renderPagination()}</div>
          </div>
          <div className="row">
            <div className="col">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" colSpan="2" className="text-white border-0">
                      SUMMARY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {block.hash ? (
                    <tr>
                      <td>hash</td>
                      <td className="no-text-transform">{block.hash}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <td>transactions</td>
                    <td>{blockStore.transactionsCount}</td>
                  </tr>
                  <tr>
                    <td>Timestamp</td>
                    <td>{blockDateStr}</td>
                  </tr>
                  <tr>
                    <td>Version</td>
                    <td>{block.version}</td>
                  </tr>
                  <tr>
                    <td>Difficulty</td>
                    {/* BlockUtils.formatDifficulty is used twice in the project, maybe make a getter property in the
                    store to reuse the logic */}
                    <td className="no-text-transform">{BlockUtils.formatDifficulty(block.difficulty)}</td>
                  </tr>
                  <tr>
                    <td>Confirmations</td>
                    {/* since the block comes from the store, maybe expose a confirmation directly there?
                    something like blockStore.blockConfirmations */}
                    <td className="no-text-transform">{blockStore.confirmations(block.blockNumber)}</td>
                  </tr>
                  <tr>
                    <td>Parent</td>
                    <td>
                      <div className="address no-text-transform break-word">
                        <Link
                          onClick={() => {
                            this.switchBlock(block.parentBlockNumber);
                          }}
                          to={`/blocks/${block.parentBlockNumber}`}
                        >
                          {block.parent}
                        </Link>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bordered border-left border-primary pl-lg-4">
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
          <Transactions blockNumber={block.blockNumber} order="asc" />
        </section>
      </div>
    );
  }
}

export default observer(BlockPage);
