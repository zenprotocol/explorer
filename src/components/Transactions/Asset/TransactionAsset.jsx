import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AssetUtils from '../../../lib/AssetUtils';
import Output from '../../../lib/OutputUtils';
import HashLink from '../../../components/HashLink/HashLink.jsx';

class TransactionAsset extends Component {
  render() {
    const { asset, showHeader } = this.props;
    if (!asset) {
      return null;
    }

    const outputs = this.getOutputs(asset);
    const inputs = this.getInputs(asset);

    return (
      <div className={classNames('TransactionAsset', asset.addressFoundIn)}>
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
          <div className="col-2 break-word"><HashLink hash={AssetUtils.getTypeFromCode(asset.asset)} /></div>
          <div className="col-4 py-0">
            <div className="inputs">{inputs.rowsToRender}</div>
            <div className="arrow">
              <i className="fas fa-arrow-right" />
            </div>
          </div>
          <div className="col-6 py-0">
            <div className="outputs">
              {outputs.rowsToRender}
              {outputs.total? this.renderTotal(asset, outputs.total) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  getInputs(asset) {
    let rowsToRender = [];

    if (!asset.inputs || !asset.inputs.length) {
      const title = 'No Inputs';
      rowsToRender.push(this.renderInputOutputItem('1', title));
    } else {
      rowsToRender = asset.inputs.reduce((all, input) => {

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

  getOutputs(asset) {
    let rowsToRender = [];
    let total = 0;
    let key = 0;
    const showAmount = AssetUtils.showAmount(asset);
    if (!asset.outputs || !asset.outputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Outputs'));
    } else {
      rowsToRender = asset.outputs.map(output => {
        key++;
        let amount = showAmount ? AssetUtils.getAmountString(asset, output.amount) : null;
        const title = output.address ? output.address : Output.getTextByLockType(output.lockType);
        const address = output.address ? output.address : '';
        total += Number(output.amount);
        return this.renderInputOutputItem(key, title, address, amount);
      });
    }

    // // total amount
    // if (showAmount) {
    //   let totalAmount = asset.outputs.reduce((total, current) => {
    //     return total + Number(current.amount);
    //   }, 0);
    //   totalAmount = Asset.getAmountString(asset, totalAmount);

    //   key++;
    //   rowsToRender.push(this.renderInputOutputItem(key, '', null, totalAmount, true));
    // }

    return { rowsToRender, total };
  }

  renderTotal(asset, total) {
    return (
      <div className="row">
        <div className="col d-flex justify-content-end">
          <div className="total rounded">{AssetUtils.getAmountString(asset, total)}</div>
        </div>
      </div>
    );
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
  asset: PropTypes.object.isRequired,
  address: PropTypes.string,
  showHeader: PropTypes.bool,
};
TransactionAsset.defaultProps = {
  address: '',
};

export default TransactionAsset;
