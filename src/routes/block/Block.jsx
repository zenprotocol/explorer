import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import Transactions from '../../components/Transactions/Transactions.jsx';
import './Block.css';

class Block extends Component {
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
    this.setState({ blockNumber: Number(params.id) });
    blockStore.fetchBlock(params.id);
  }

  componentDidUpdate(prevProps, prevState) {
    if (Number(this.props.match.params.id) !== Number(prevProps.match.params.id)) {
      blockStore.fetchBlock(Number(this.props.match.params.id));
    }
  }

  renderPagination() {
    const blockNumber = this.state.blockNumber;
    let prevDisabled = false;
    let nextDisabled = false;
    if (blockNumber <= 1) {
      prevDisabled = true;
    }
    if (blockNumber >= blockStore.totalBlocks) {
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
    this.setState({ blockNumber });
  }

  render() {
    const block = blockStore.block;
    const transactions = block.Transactions;
    const medianTime = blockStore.medianTimeString;
    return (
      <div className="Block">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2">{medianTime}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                BLOCK #{block.blockNumber}
              </h1>
            </div>
            <div className="col-sm">{this.renderPagination()}</div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" colSpan="2" className="text-white border-0">
                      SUMMARY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Number of transactions</td>
                    <td>{blockStore.numberOfTransactions}</td>
                  </tr>
                  <tr>
                    <td>Timestamp</td>
                    <td>{new Date(Number(block.timestamp)).toUTCString()}</td>
                  </tr>
                  <tr>
                    <td>Version</td>
                    <td>{block.version}</td>
                  </tr>
                  <tr>
                    <td>Difficulty</td>
                    <td>{block.difficulty}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-lg-6">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" colSpan="2" className="text-white border-0">
                      Hashes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Parent</td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '150px' }}>
                        {block.parent}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <Transactions transactions={transactions} />
      </div>
    );
  }
}

Block.propTypes = {
  match: PropTypes.object,
};

export default observer(Block);
