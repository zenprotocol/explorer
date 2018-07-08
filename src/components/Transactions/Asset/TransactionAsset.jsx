import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class TransactionAsset extends Component {
  render() {
    const asset = this.props.asset;
    if (!asset) {
      return null;
    }

    return (
      <div className="TransactionAsset">
        <div className="row mx-0">
          <div className="col-2 border-bottom">ASSET</div>
          <div className="col-4 border-bottom">INPUT</div>
          <div className="col-6 border-bottom">
            <div className="row">
              <div className="col-9 py-0">OUTPUT</div>
              <div className="col-3 py-0">TOTAL</div>
            </div>
          </div>
        </div>
        <div className="row mx-0">
          <div className="col-2 break-word">{asset.asset}</div>
          <div className="col-4 py-0">
            <div className="inputs">{this.renderInputs(asset)}</div>
            <div className="arrow">{'->'}</div>
          </div>
          <div className="col-6 py-0">
            <div className="outputs">{this.renderOutputs(asset)}</div>
          </div>
        </div>
      </div>
    );
  }

  renderInputs(asset) {
    let rowsToRender = [];

    if (!asset.inputs || !asset.inputs.length) {
      const title = this.isCoinbase(asset) ? 'Mining Reward' : 'No Inputs';
      rowsToRender.push(this.renderInputOutputItem('1', title));
    } else {
      rowsToRender = asset.inputs.map(input => {
        if (!input.Output) {
          return null;
        }
        return this.renderInputOutputItem(input.id, input.Output.address, '');
      });
    }

    return rowsToRender;
  }

  renderOutputs(asset) {
    let rowsToRender = [];
    let key = 0;
    const isZP = asset.asset === '00'; // ZP
    const showAmount = isZP;
    if (!asset.outputs || !asset.outputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Outputs'));
    } else {
      rowsToRender = asset.outputs.map(output => {
        key++;
        let amount = showAmount? output.amount : null;
        amount = isZP? amount / 100000000 : amount;
        return this.renderInputOutputItem(key, output.address, '', amount);
      });
    }

    if (showAmount) {
      let totalAmount = asset.outputs.reduce((total, current) => {
        return total + Number(current.amount);
      }, 0);
      totalAmount = isZP? totalAmount / 100000000 : totalAmount;
  
      key++;
      rowsToRender.push(this.renderInputOutputItem(key, '', null, totalAmount, true));
    }

    return rowsToRender;
  }

  isCoinbase(asset) {
    return (
      asset.outputs &&
      asset.outputs.length &&
      asset.outputs[0].lockType &&
      asset.outputs[0].lockType.toLowerCase() === 'coinbase'
    );
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
        <div className="address break-word no-text-transform col-9" title={title}>
          {url ? <a href={url}>{title}</a> : title}
        </div>
        <div
          className={classNames('col-3 address break-word', { 'font-weight-bold': isTotal })}
          title={amount ? amount + ' ZP' : ''}
        >
          {amount ? amount + ' ZP' : ''}
        </div>
      </div>
    );
  }
}

TransactionAsset.propTypes = {
  asset: PropTypes.object.isRequired,
};

export default TransactionAsset;
