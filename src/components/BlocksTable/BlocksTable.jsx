import React, { Component } from 'react';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import './BlocksTable.css';
import PaginationComponent from './Pagination.jsx';

const PAGE_SIZES = [5, 10, 20, 50, 100];
const MIN_COL_WIDTH = 140;

export default class BlocksTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageSize: 10,
      page: 0,
    };

    this.setPageSize = this.setPageSize.bind(this);
  }
  getTableColumns() {
    return [
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: MIN_COL_WIDTH,
        Cell: function(data) {
          const date = new Date(Number(data.value));
          return date.toUTCString();
        },
      },
      {
        Header: 'Block number',
        accessor: 'blockNumber',
        className: 'text-primary',
        width: MIN_COL_WIDTH,
      },
      {
        Header: 'Version',
        accessor: 'version',
        width: 100,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        className: 'text-primary',
      },
      {
        Header: 'Commitments',
        accessor: 'commitments',
        className: 'text-primary',
        minWidth: MIN_COL_WIDTH,
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        minWidth: MIN_COL_WIDTH,
      },
      {
        Header: 'Nonce1',
        accessor: 'nonce1',
      },
      {
        Header: 'Nonce2',
        accessor: 'nonce2',
        minWidth: 80,
      },
    ];
  }

  setPageSize(event) {
    this.setState({ pageSize: Number(event.target.value) });
  }

  getLatestBlockDateString() {
    if (this.props.blocks.length) {
      return new Date(
        Number(this.props.blocks[this.props.blocks.length - 1].timestamp)
      ).toUTCString();
    }
    return null;
  }

  render() {
    return (
      <div className="BlocksTable">
        <div className="clearfix">
          {this.props.blocks.length ? (
            <div className="medianTime mb-1 mb-lg-2">{this.getLatestBlockDateString()}</div>
          ) : (
            ''
          )}
          {this.props.title && (
            <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
              {this.props.title}
            </h1>
          )}
          <div className="BlocksTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={this.state.pageSize}
              onChange={this.setPageSize}
              className="form-control d-block d-md-inline-block"
            >
              {PAGE_SIZES.map(pageSize => {
                return (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                );
              })}
            </select>
            <span className="ml-2 d-none d-md-inline-block">ENTRIES</span>
          </div>
        </div>
        <ReactTable
          data={this.props.blocks}
          columns={this.getTableColumns()}
          showPaginationBottom={true}
          defaultPageSize={10}
          pageSizeOptions={PAGE_SIZES}
          pageSize={this.state.pageSize}
          PaginationComponent={PaginationComponent}
          previousText="<"
          nextText=">"
        />
      </div>
    );
  }
}
