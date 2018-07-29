import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import TextUtils from '../../lib/TextUtils';
import Transactions from '../../components/Transactions/Transactions.jsx';
import BlockUtils from '../../lib/BlockUtils';
import Loading from '../../components/Loading/Loading.jsx';
import HashLink from '../../components/HashLink/HashLink.jsx';
import './Block.css';

class BlockPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      blockNumber: 0,
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    blockStore.fetchBlock(params.id).then((block) => {
      this.switchBlock(block.blockNumber);
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      blockStore.fetchBlock(this.props.match.params.id).then((block) => {
        this.switchBlock(block.blockNumber);
      });
    }
  }

  renderPagination() {
    const blockNumber = this.state.blockNumber;
    let prevDisabled = false;
    let nextDisabled = false;
    if (blockNumber <= 1) {
      prevDisabled = true;
    }
    if (blockNumber >= blockStore.blocksCount) {
      nextDisabled = true;
    }

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
            <a className="page-link bg-transparent border-0">BLOCK {blockNumber}</a>
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

  switchBlock(blockNumber) {
    this.setState({ blockNumber: Number(blockNumber) });
  }

  render() {
    const block = blockStore.block;
    const blockDateStr = block.timestamp ? TextUtils.getDateStringFromTimestamp(block.timestamp) : '';

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
                      <td className="no-text-transform">
                        <HashLink
                          hash={block.hash}
                          shorten={false}
                        />
                      </td>
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
                    <td className="no-text-transform">{BlockUtils.formatDifficulty(block.difficulty)}</td>
                  </tr>
                  <tr>
                    <td>Confirmations</td>
                    <td className="no-text-transform">{blockStore.confirmations(block.blockNumber)}</td>
                  </tr>
                  <tr>
                    <td>Parent</td>
                    <td>
                      <div className="address no-text-transform break-word">
                        <HashLink 
                          // onClick={() => {
                          //   this.switchBlock(block.parentBlockNumber);
                          // }}
                          url={`/blocks/${block.parent}`}
                          hash={block.parent}
                        />
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

BlockPage.propTypes = {
  match: PropTypes.object,
};

export default observer(BlockPage);
