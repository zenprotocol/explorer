import React, { Component } from 'react';
import ReactTable from 'react-table';
import { observer } from 'mobx-react';
import {Link} from 'react-router-dom';
import 'react-table/react-table.css';
import PropTypes from 'prop-types';
import TextUtils from '../../lib/TextUtils';
import './BlocksTable.css';
import PaginationComponent from './Pagination.jsx';

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
        Cell: function(data) {
          const date = new Date(Number(data.value));
          return TextUtils.getDateString(date);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        width: 80,
        Cell: row => (
          <Link to={`/blocks/${row.value}`}>{row.value}</Link>
        ),
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        minWidth: 450,
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        Cell: function(data) {
          return Number(data.value).toString(16);
        },
      },
      {
        Header: 'Transactions',
        accessor: 'transactionsCount',
      },
    ];
  }

  setPageSize(event) {
    this.setState({ pageSize: Number(event.target.value) });
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
          {store.medianTime ? (
            <div className="medianTime mb-1 mb-lg-2">{store.medianTimeString}</div>
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
          sortable={false}
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