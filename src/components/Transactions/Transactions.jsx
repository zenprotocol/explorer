import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Transactions.css';

class Transactions extends Component {
  render() {
    const transactions = this.props.transactions;
    if (!transactions || !transactions.length) {
      return null;
    }

    return (
      <section className="bordered border-left border-primary pl-lg-4">
        <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
        {transactions.map((transaction, index) => {
          return (
            <div className="Transaction" key={transaction.id}>
              <div className="hash mb-4 text-truncate no-text-transform">
                {(index === 0)? (<h5 className="coinbase d-inline-block mr-1 text-white">Coinbase - </h5>) : null}
                <a href="#">{transaction.hash}</a>
              </div>
              <div className="row mx-0">
                <div className="col-6 border-bottom">INPUT</div>
                <div className="col-6 border-bottom">
                  <div className="row">
                    <div className="col-9 py-0">OUTPUT</div>
                    <div className="col-3 py-0">TOTAL</div>
                  </div>
                </div>
              </div>
              <div className="row mx-0">
                <div className="col-6 py-0">
                  <div className="inputs">{this.renderInputs(transaction)}</div>
                  <div className="arrow">{'->'}</div>
                </div>
                <div className="col-6 py-0">{this.renderOutputs(transaction)}</div>
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  renderInputs(transaction) {
    let rowsToRender = [];
    let key = 0;
    const numOfRows =
      transaction.Outputs.length > transaction.Inputs.length
        ? transaction.Outputs.length + 1
        : transaction.Inputs.length;
    if (!transaction.Inputs || !transaction.Inputs.length) {
      const title = this.isCoinbase(transaction) ? 'Mining Reward' : 'No Inputs';
      rowsToRender.push(this.renderInputOutputItem(key, title));
    } else {
      rowsToRender = transaction.Inputs.map(input => {
        if (!input.Output) {
          return null;
        }
        key++;
        return this.renderInputOutputItem(key, input.Output.address, '#');
      });
    }
    const emptyRows = this.getEmptyRows(rowsToRender, numOfRows, key);
    rowsToRender = rowsToRender.concat(emptyRows);

    return rowsToRender;
  }

  isCoinbase(transaction) {
    return (
      transaction.Outputs &&
      transaction.Outputs.length &&
      transaction.Outputs[0].lockType &&
      transaction.Outputs[0].lockType.toLowerCase() === 'coinbase'
    );
  }

  renderOutputs(transaction) {
    let rowsToRender = [];
    let key = 0;
    const numOfRows = Math.max(transaction.Outputs.length, transaction.Inputs.length);
    if (!transaction.Outputs || !transaction.Outputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Outputs'));
    } else {
      rowsToRender = transaction.Outputs.map(output => {
        key++;
        return this.renderInputOutputItem(key, output.address, '#', output.amount);
      });
    }

    const totalAmount = transaction.Outputs.reduce((total, current) => {
      return total + Number(current.amount);
    }, 0);

    key++;
    rowsToRender.push(this.renderInputOutputItem(key, '', null, totalAmount, true));
    const emptyRows = this.getEmptyRows(rowsToRender, numOfRows, key);
    rowsToRender = rowsToRender.concat(emptyRows);

    return rowsToRender;
  }

  getEmptyRows(array, numOfRows, lastIndexForKey) {
    let key = lastIndexForKey;
    let addedRowsArray = [];
    if (array.length < numOfRows) {
      for (let i = 0; i < numOfRows - array.length; i++) {
        key++;
        addedRowsArray.push(this.renderInputOutputItem(key, ''));
      }
    }
    return addedRowsArray;
  }

  renderInputOutputItem(key, title, url, amount, isTotal) {
    title = title || '\u00a0';
    return (
      <div className="row" key={key}>
        <div className="address text-truncate no-text-transform border-bottom col-9" title={title}>
          {url ? <a href={url}>{title}</a> : title}
        </div>
        <div
          className={classNames('col-3 address text-truncate border-bottom', { 'font-weight-bold': isTotal })}
          title={amount ? amount + ' ZP' : ''}
        >
          {amount ? amount + ' ZP' : ''}
        </div>
      </div>
    );
  }
}

Transactions.propTypes = {
  transactions: PropTypes.array,
};

export default Transactions;
