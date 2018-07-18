import React, { Component } from 'react';
import { observer } from 'mobx-react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import TextUtils from '../../lib/TextUtils';
import Transaction from '../../components/Transactions/Transaction.jsx';
import './Transaction.css';

class TransactionPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hash: '',
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    this.setState({ hash: Number(params.hash) });
    blockStore.fetchTransaction(params.hash);
  }

  render() {
    const transaction = blockStore.transaction;
    if (!transaction) {
      return null;
    }
    
    const blockDateStr = transaction.Block.timestamp ? TextUtils.getDateString(new Date(Number(transaction.Block.timestamp))) : '';

    return (
      <div className="Transaction">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2">{blockDateStr}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transaction</h1>
            </div>
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
                  <tr>
                    <td>Block</td>
                    <td><Link to={`/blocks/${transaction.Block.blockNumber}`}>{transaction.Block.blockNumber}</Link></td>
                  </tr>
                  <tr>
                    <td>Confirmations</td>
                    <td className="no-text-transform">{blockStore.confirmations(transaction.Block.blockNumber)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <Transaction transaction={transaction} disableTXLinks={true} />
        </section>
      </div>
    );
  }
}

TransactionPage.propTypes = {
  match: PropTypes.object,
};

export default observer(TransactionPage);
