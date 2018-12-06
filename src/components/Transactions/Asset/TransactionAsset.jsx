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

const SHOW_LESS_SIZE = 5;

class TransactionAsset extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMore: false,
      rowsData: [],
    };

    this.toggleShowMore = this.toggleShowMore.bind(this);
  }

  componentDidMount() {
    const { transactionAsset, asset, address, addressFoundIn, total } = this.props;

    if (transactionAsset) {
      const outputs = this.getOutputs(transactionAsset);
      const inputs = this.getInputs(transactionAsset);
      this.setState({
        rowsData: this.getRowsData({
          asset,
          address,
          inputs,
          outputs: this.filterOutputsByAddress(outputs, address, addressFoundIn),
          total,
        }),
      });
    }
  }

  toggleShowMore() {
    this.setState(state => ({
      showMore: !state.showMore,
    }));
  }

  render() {
    const { transactionAsset, showHeader, addressFoundIn, showAsset } = this.props;
    const { showMore, rowsData } = this.state;

    if (!transactionAsset || rowsData.length === 0) {
      return null;
    }

    // show all rows if less than the limit, otherwise the limit
    const numOfRows =
      rowsData.length <= SHOW_LESS_SIZE || showMore ? rowsData.length : SHOW_LESS_SIZE;
    const rowsToRender = rowsData.slice(0, numOfRows);
    // add a show more row to the table's data
    if (rowsData.length > SHOW_LESS_SIZE) {
      rowsToRender.push({
        showMore,
      });
    }

    return (
      <div
        className={classNames('TransactionAsset', addressFoundIn, { 'hide-header': !showHeader })}
      >
        <GenericTable
          loading={false}
          data={rowsToRender}
          columns={this.getTableColumns({ showAsset })}
          defaultPageSize={rowsToRender.length}
          pages={1}
          page={0}
          pageSize={rowsToRender.length}
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

  filterOutputsByAddress(outputs, address, addressFoundIn) {
    if (!address || addressFoundIn.includes('input')) {
      return outputs;
    }
    return outputs.filter(output => output.data === address);
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
              Cell: ({ value, original }) => {
                if (typeof original.showMore !== 'undefined') {
                  return (
                    <ButtonShowMore showMore={original.showMore} onClick={this.toggleShowMore} />
                  );
                } else {
                  return (
                    value && (
                      <HashLink
                        hash={AssetUtils.getAssetNameFromCode(value)}
                        value={value}
                        url={`/assets/${value}`}
                      />
                    )
                  );
                }
              },
            },
          ]
        : []),
      {
        Header: 'Input',
        accessor: 'input',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({ value, original }) => {
          if (typeof original.showMore !== 'undefined') {
            // make sure the button does not appear in the asset column already
            return (
              !showAsset && (
                <ButtonShowMore showMore={original.showMore} onClick={this.toggleShowMore} />
              )
            );
          } else {
            return original.isInputHash ? (
              <AddressLink address={value} active={original.isInputActive} hash={value} />
            ) : (
              value || '\u00a0'
            );
          }
        },
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
        Cell: ({ value, original }) => {
          return typeof value !== 'undefined' ? (
            <div className={classNames('amount rounded', { total: original.isTotal })}>
              {AssetUtils.getAmountString(asset, Number(value))}
            </div>
          ) : (
            ''
          );
        },
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

function ButtonShowMore({ showMore, onClick }) {
  const btnText = showMore ? 'Show less' : 'Show more';
  return (
    <button className="btn btn-link p-0" onClick={onClick}>
      {btnText}
    </button>
  );
}
ButtonShowMore.propTypes = {
  showMore: PropTypes.bool,
  onClick: PropTypes.func,
};

export default TransactionAsset;
