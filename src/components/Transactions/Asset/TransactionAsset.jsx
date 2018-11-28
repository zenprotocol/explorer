import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import AssetUtils from '../../../lib/AssetUtils';
import OutputUtils from '../../../lib/OutputUtils';
import config from '../../../lib/Config';
import HashLink from '../../../components/HashLink';
import AddressLink from '../../../components/AddressLink';
import GenericTable from '../../../components/GenericTable';
import './TransactionAsset.scss';

class TransactionAsset extends Component {
  render() {
    const {
      transactionAsset,
      asset,
      address,
      showHeader,
      addressFoundIn,
      showAsset,
      total,
    } = this.props;
    if (!transactionAsset) {
      return null;
    }

    const outputs = this.getOutputs(transactionAsset);
    const inputs = this.getInputs(transactionAsset);
    const rowsData = this.getRowsData({ asset, address, inputs, outputs, total });
    
    return (
      <div
        className={classNames('TransactionAsset', addressFoundIn, { 'hide-header': !showHeader })}
      >
        <GenericTable
          loading={false}
          data={rowsData}
          columns={this.getTableColumns({ showAsset })}
          defaultPageSize={rowsData.length}
          pages={1}
          page={0}
          pageSize={rowsData.length}
        />
      </div>
    );
  }

  getInputs(transactionAsset) {
    if (!transactionAsset.Inputs || !transactionAsset.Inputs.length) {
      return [this.getDataItem({ data: 'No Inputs', isHash: false })];
    } else {
      return transactionAsset.Inputs.map(input => {
        return input.Output.address
          ? this.getDataItem({ data: input.Output.address })
          : this.getDataItem({
              data: OutputUtils.getTextByLockType(input.Output.lockType),
              isHash: false,
            });
      });
    }
  }

  getOutputs(transactionAsset) {
    if (!transactionAsset.Outputs || !transactionAsset.Outputs.length) {
      return [this.getDataItem({ data: 'No Outputs', isHash: false })];
    } else {
      return transactionAsset.Outputs.map(output => {
        let amount = output.amount;
        return output.address
          ? this.getDataItem({ data: output.address, amount })
          : this.getDataItem({
              data: OutputUtils.getTextByLockType(output.lockType),
              amount,
              isHash: false,
            });
      });
    }
  }

  getDataItem({ data, amount, isHash = true } = {}) {
    return {
      data,
      amount,
      isHash,
    };
  }

  getRowsData({ asset, address, inputs, outputs, total } = {}) {
    const rowsData = [];
    const maxLength = Math.max(1, outputs.length, inputs.length);
    for (let i = 0; i < maxLength; i++) {
      const input = i < inputs.length ? inputs[i] : {};
      const output = i < outputs.length ? outputs[i] : {};
      rowsData.push({
        asset: i === 0 ? asset : '',
        input: input.data,
        isInputHash: input.isHash,
        isInputActive: input.isHash && input.data !== address,
        output: output.data,
        isOutputHash: output.isHash,
        isOutputActive: output.isHash && output.data !== address,
        amount: output.amount,
      });
    }

    // total
    if (typeof total !== 'undefined') {
      rowsData.push({
        amount: total,
        isTotal: true,
      });
    }

    return rowsData;
  }

  getTableColumns({ showAsset } = {}) {
    const { asset } = this.props;
    return [
      ...(showAsset
        ? [
            {
              Header: 'Asset',
              accessor: 'asset',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) =>
                value && (
                  <HashLink
                    hash={AssetUtils.getAssetNameFromCode(value)}
                    value={value}
                    url={`/assets/${value}`}
                  />
                ),
            },
          ]
        : []),
      {
        Header: 'Input',
        accessor: 'input',
        minWidth: config.ui.table.minCellWidth,
        Cell: data =>
          data.original.isInputHash ? (
            <AddressLink
              address={data.value}
              active={data.original.isInputActive}
              hash={data.value}
            />
          ) : (
            data.value || '\u00a0'
          ),
      },
      {
        Header: '',
        maxWidth: 30,
        Cell: data =>
          data.index === 0 ? (
            <div className="arrow">
              <i className="fas fa-arrow-right" />
            </div>
          ) : (
            ''
          ),
      },
      {
        Header: 'Output',
        accessor: 'output',
        minWidth: config.ui.table.minCellWidth,
        Cell: data =>
          data.original.isOutputHash ? (
            <AddressLink
              address={data.value}
              active={data.original.isOutputActive}
              hash={data.value}
            />
          ) : (
            data.value || '\u00a0'
          ),
      },
      {
        Header: 'Total',
        accessor: 'amount',
        className: 'column-total',
        headerClassName: 'column-total',
        Cell: ({ value, original }) =>
          typeof value !== 'undefined' ? (
            <div className={classNames('amount rounded', { total: original.isTotal })}>
              {AssetUtils.getAmountString(asset, Number(value))}
            </div>
          ) : (
            ''
          ),
      },
    ];
  }
}

TransactionAsset.propTypes = {
  transactionAsset: PropTypes.object.isRequired,
  asset: PropTypes.string.isRequired,
  address: PropTypes.string,
  addressFoundIn: PropTypes.array,
  showHeader: PropTypes.bool,
  showAsset: PropTypes.bool,
  total: PropTypes.number,
};
TransactionAsset.defaultProps = {
  address: '',
};

export default TransactionAsset;
