import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AssetUtils from '../../../lib/AssetUtils';
import Output from '../../../lib/OutputUtils';
import HashLink from '../../../components/HashLink/HashLink.jsx';
import './TransactionAsset.css';

class TransactionAsset extends Component {
  render() {
    const { transactionAsset, asset, showHeader, addressFoundIn } = this.props;
    if (!transactionAsset) {
      return null;
    }

    const outputs = this.getOutputs(transactionAsset, asset);
    const inputs = this.getInputs(transactionAsset);

    return (
      <div className={classNames('TransactionAsset', addressFoundIn)}>
        {showHeader ? (
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
        ) : null}

        <div className="row mx-0">
          <div className="col-2 break-word"><HashLink hash={AssetUtils.getAssetNameFromCode(asset)} value={asset} /></div>
          <div className="col-4 py-0">
            <div className="inputs">{inputs.rowsToRender}</div>
            <div className="arrow">
              <i className="fas fa-arrow-right" />
            </div>
          </div>
          <div className="col-6 py-0">
            <div className="outputs">
              {outputs.rowsToRender}
              {this.renderTotal()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  getInputs(transactionAsset) {
    let rowsToRender = [];

    if (!transactionAsset.Inputs || !transactionAsset.Inputs.length) {
      const title = 'No Inputs';
      rowsToRender.push(this.renderInputOutputItem('1', title));
    } else {
      rowsToRender = transactionAsset.Inputs.reduce((all, input) => {

        if (input.Output.address) {
          all.push(this.renderInputOutputItem(input.id, input.Output.address, input.Output.address));
        } else {
          const title = Output.getTextByLockType(input.Output.lockType);
          all.push(this.renderInputOutputItem(input.id, title, ''));
        }

        return all;
      }, []);
    }

    return {rowsToRender};
  }

  getOutputs(transactionAsset, asset) {
    let rowsToRender = [];
    let key = 0;
    const showAmount = AssetUtils.showAmount(transactionAsset);
    if (!transactionAsset.Outputs || !transactionAsset.Outputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Outputs'));
    } else {
      rowsToRender = transactionAsset.Outputs.map(output => {
        key++;
        let amount = showAmount ? AssetUtils.getAmountString(asset, output.amount) : null;
        const title = output.address ? output.address : Output.getTextByLockType(output.lockType);
        const address = output.address ? output.address : '';
        return this.renderInputOutputItem(key, title, address, amount);
      });
    }

    return { rowsToRender };
  }

  renderTotal() {
    const {total, asset} = this.props;
    if(!total) {
      return null;
    }

    return (
      <div className="row">
        <div className="col d-flex justify-content-end">
          <div className="total rounded">{AssetUtils.getAmountString(asset, total)}</div>
        </div>
      </div>
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

  renderInputOutputItem(key, title, address, amount, isTotal) {
    title = title || '\u00a0';
    const url = address && address !== this.props.address ? `/address/${address}` : '';
    return (
      <div className="row" key={key}>
        <div className="address break-word no-text-transform col-9" title={title}>
          {address? (<HashLink url={url? url : ''} hash={title} />) : title}
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

TransactionAsset.propTypes = {
  transactionAsset: PropTypes.object.isRequired,
  asset: PropTypes.string.isRequired,
  address: PropTypes.string,
  addressFoundIn: PropTypes.array,
  showHeader: PropTypes.bool,
  total: PropTypes.number,
};
TransactionAsset.defaultProps = {
  address: '',
};

export default TransactionAsset;
