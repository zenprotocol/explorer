import React, { Component } from 'react';
import ReactTable from 'react-table';
import { observer } from 'mobx-react';
import {Link} from 'react-router-dom';
import 'react-table/react-table.css';
import './BlocksTable.css';
import PaginationComponent from './Pagination.jsx';
import PropTypes from 'prop-types';

const MIN_COL_WIDTH = 140;

class BlocksTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageSize: props.pageSize,
      page: 0,
    };

    this.setPageSize = this.setPageSize.bind(this);
    this.fetchData = this.fetchData.bind(this);
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
        width: MIN_COL_WIDTH,
        Cell: row => (
          <Link to={`/blocks/${row.value}`}>{row.value}</Link>
        ),
      },
      {
        Header: 'Version',
        accessor: 'version',
        width: 100,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
      },
      {
        Header: 'Commitments',
        accessor: 'commitments',
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

  getMedianTimeString() {
    if (this.props.store.medianTime) {
      return this.props.store.medianTime.toUTCString();
    }
    return null;
  }

  fetchData(state) {
    this.props.store.fetchBlocks({pageSize: state.pageSize,page: state.page, sorted: state.sorted});
  }

  render() {
    const store = this.props.store;
    const numOfPages = Math.ceil(store.totalBlocks / this.state.pageSize);
    return (
      <div className="BlocksTable">
        <div className="clearfix">
          {this.props.store.blocks.length ? (
            <div className="medianTime mb-1 mb-lg-2">{this.getMedianTimeString()}</div>
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
              {this.props.pageSizes.map(pageSize => {
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
          manual
          onFetchData={this.fetchData}
          data={store.blocks}
          columns={this.getTableColumns()}
          showPaginationBottom={true}
          defaultPageSize={10}
          pageSizeOptions={this.props.pageSizes}
          pages={numOfPages}
          pageSize={this.state.pageSize}
          PaginationComponent={PaginationComponent}
          previousText="<"
          nextText=">"
        />
      </div>
    );
  }
}

BlocksTable.defaultProps = {
  pageSizes: [5, 10, 20, 50, 100]
};

BlocksTable.propTypes = {
  pageSize: PropTypes.number,
  pageSizes: PropTypes.array,
  store: PropTypes.object,
};

export default observer(BlocksTable);