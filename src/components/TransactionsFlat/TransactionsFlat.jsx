import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import '../Transactions/Transactions.css';
import Asset from '../../lib/AssetUtils';
import Output from '../../lib/OutputUtils';

class TransactionsFlat extends Component {
  render() {
    const {transactions,disableTXLinks} = this.props;

    if (!transactions || !transactions.length) {
      return null;
    }
    return (
      <div className="Transactions">
        {transactions.map((transaction, index) => {
          return (
            <div className="Transaction" key={index}>
              <div className="hash mb-4 text-truncate no-text-transform">
                {disableTXLinks
                  ? transaction.hash
                  : <Link to={`/tx/${transaction.hash}`}>{transaction.hash}</Link>}
              </div>
              <div className="InsOuts">
                <div className="row mx-0">
                  <div className="col-6 border-bottom">FROM</div>
                  <div className="col-6 border-bottom">
                    <div className="row">
                      <div className="col-9 py-0">TO</div>
                      <div className="col-3 py-0">TOTAL</div>
                    </div>
                  </div>
                </div>
                <div className="row mx-0">
                  <div className="col-6 py-0">
                    <div className="inputs">{this.renderInputs(transaction)}</div>
                    <div className="arrow">{'->'}</div>
                  </div>
                  <div className="col-6 py-0">
                    <div className="outputs">{this.renderOutputs(transaction)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  renderInputs(transaction) {
    if (!transaction.inputs || !transaction.inputs.length) {
      const title = 'No Inputs';
      return [(this.renderInputOutputItem('1', title))];
    }
    return transaction.inputs.map(input => {
      return this.renderInputOutputItem(input.id, input.address, input.address);
    });
  }

  renderOutputs(transaction) {
    const showAmount = Asset.showAmount(transaction);
    if (!transaction.outputs || !transaction.outputs.length) {
      return[this.renderInputOutputItem(0, 'No Outputs')];
    } 
    return transaction.outputs.map((output, idx) => {
      let amount = showAmount ? Asset.getAmountString(output, output.amount) : null;
      const title = output.address? output.address : Output.getTextByLockType(output.lockType);
      return this.renderInputOutputItem(idx, title, output.address, amount);
    });
  }

  renderInputOutputItem(key, title = '\u00a0', address, amount, isTotal) {
    return (
      <div className="row" key={key}>
        <div className="address break-word no-text-transform col-9" title={title}>
          {address ? <Link to={`/address/${address}`}>{title}</Link> : title}
        </div>
        <div
          className={classNames('col-3 address break-word', { 'font-weight-bold': isTotal })}
          title={amount}
        >
          {amount}
        </div>
      </div>
    );
  }
}

TransactionsFlat.propTypes = {
  transactions: PropTypes.array,
  disableTXLinks: PropTypes.bool,
};

export default TransactionsFlat;
