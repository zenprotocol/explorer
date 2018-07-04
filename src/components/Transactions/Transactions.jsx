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
        {transactions.map(transaction => {
          const numOfRows = Math.max(transaction.Inputs.length, transaction.Outputs.length);
          return (
            <div className="Transaction" key={transaction.id}>
              <div className="hash mb-4 text-truncate">
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
                  <div className="inputs">{this.renderInputs(transaction, numOfRows)}</div>
                  <div className="arrow">{'->'}</div>
                </div>
                <div className="col-6 py-0">{this.renderOutputs(transaction, numOfRows)}</div>
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  renderInputs(transaction, numOfRows) {
    let rowsToRender = [];
    let key = 0;
    if (!transaction.Inputs || !transaction.Inputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Inputs'));
    } else {
      rowsToRender = transaction.Inputs.map(input => {
        if (!input.Output) {
          return null;
        }
        key++;
        return this.renderInputOutputItem(key, input.Output.address, '#');
      });
    }
    this.addEmptyRows(rowsToRender, numOfRows + 1, key); // add the totals row

    return rowsToRender;
  }

  renderOutputs(transaction, numOfRows) {
    let rowsToRender = [];
    let key = 0;
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

    key += this.addEmptyRows(rowsToRender, numOfRows, key);

    key++;
    rowsToRender.push(this.renderInputOutputItem(key, '', null, totalAmount, true));

    return rowsToRender;
  }

  addEmptyRows(array, numOfRows, lastIndexForKey) {
    let numOfRowsAdded = 0;
    let key = lastIndexForKey;
    if (array.length < numOfRows) {
      for (let i = 0; i <= numOfRows - array.length; i++) {
        key++;
        array.push(this.renderInputOutputItem(key, ''));
        numOfRowsAdded++;
      }
    }
    return numOfRowsAdded;
  }

  renderInputOutputItem(key, title, url, amount, isTotal) {
    title = title || '\u00a0';
    return (
      <div className="row" key={key}>
        <div className="address text-truncate border-bottom col-9" title={title}>
          {url ? <a href={url}>{title}</a> : title}
        </div>
        <div
          className={classNames('col-3 address text-truncate border-bottom', { 'font-weight-bold': isTotal })}
          title={amount ? amount + ' ZENP' : ''}
        >
          {amount ? amount + ' ZENP' : ''}
        </div>
      </div>
    );
  }
}

Transactions.propTypes = {
  transactions: PropTypes.array,
};

export default Transactions;
