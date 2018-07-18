import React, { Component } from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Asset from '../../../lib/AssetUtils';
import Output from '../../../lib/OutputUtils';

class TransactionAsset extends Component {
  render() {
    const {asset, showHeader} = this.props;
    if (!asset) {
      return null;
    }

    return (
      <div className="TransactionAsset">
        <div className="row mx-0">
          <div className="col-12 border-bottom">ASSET</div>
        </div>
        <div className="row mx-0">
          <div className="col-2 border-bottom">{Asset.getTypeFromCode(asset.asset)}</div>
          <div className="col-4 border-bottom">{showHeader? 'INPUT' : ''}</div>
          <div className="col-6 border-bottom">
            <div className="row">
              <div className="col-9 py-0">{showHeader? 'OUTPUT' : ''}</div>
              <div className="col-3 py-0">{showHeader? 'TOTAL' : ''}</div>
            </div>
          </div>
        </div>
        
        <div className="row mx-0">
          <div className="col-2 break-word"></div>
          <div className="col-4 py-0">
            <div className="inputs">{this.renderInputs(asset)}</div>
            <div className="arrow"><i className="fas fa-arrow-right"></i></div>
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
      const title = 'No Inputs';
      rowsToRender.push(this.renderInputOutputItem('1', title));
    } else {
      const addedInputAddresses = [];
      rowsToRender = asset.inputs.reduce((all, input) => {
        if(!input.Output) {
          return all;
        }

        if(input.Output.address) {
          if(!addedInputAddresses.includes(input.Output.address)){
            addedInputAddresses.push(input.Output.address);
            all.push(this.renderInputOutputItem(input.id, input.Output.address, input.Output.address));
          }
        }
        else {
          const title = Output.getTextByLockType(input.Output.lockType);
          all.push(this.renderInputOutputItem(input.id, title, ''));
        }

        return all;
      }, []);
    }

    return rowsToRender;
  }

  renderOutputs(asset) {
    let rowsToRender = [];
    let key = 0;
    const showAmount = Asset.showAmount(asset);
    if (!asset.outputs || !asset.outputs.length) {
      rowsToRender.push(this.renderInputOutputItem(key, 'No Outputs'));
    } else {
      rowsToRender = asset.outputs.map(output => {
        key++;
        let amount = showAmount ? Asset.getAmountString(asset, output.amount) : null;
        const title = output.address? output.address : Output.getTextByLockType(output.lockType);
        const address =  output.address? output.address : '';
        return this.renderInputOutputItem(key, title, address, amount);
      });
    }

    // total amount
    // if (showAmount) {
    //   let totalAmount = asset.outputs.reduce((total, current) => {
    //     return total + Number(current.amount);
    //   }, 0);
    //   totalAmount = Asset.getAmountString(asset, totalAmount);

    //   key++;
    //   rowsToRender.push(this.renderInputOutputItem(key, '', null, totalAmount, true));
    // }

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

  renderInputOutputItem(key, title, address, amount, isTotal) {
    title = title || '\u00a0';
    return (
      <div className="row" key={key}>
        <div className="address break-word no-text-transform col-9" title={title}>
          {address && address !== this.props.address ? <Link to={`/address/${address}`}>{title}</Link> : title}
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
