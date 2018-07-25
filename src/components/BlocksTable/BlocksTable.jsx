import React, { Component } from 'react';
import ReactTable from 'react-table';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import 'react-table/react-table.css';
import TextUtils from '../../lib/TextUtils';
import './BlocksTable.css';
import PaginationComponent from './Pagination.jsx';
import uiStore from '../../store/UIStore';
import BlockUtils from '../../lib/BlockUtils';
import HashLink from '../HashLink/HashLink.jsx';

class BlocksTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      windowWidth: 0
    };

    this.setPageSize = this.setPageSize.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.setWindowWidth = debounce(this.setWindowWidth, 200).bind(this);
  }

  componentDidMount() {
    this.setWindowWidth();
    window.addEventListener('resize', this.setWindowWidth);
  }

  componentWillUnmount(){
    window.removeEventListener('resize', this.setWindowWidth);
  }

  setWindowWidth() {
    this.setState({windowWidth: window.innerWidth});
  }

  getTableColumns() {
    return [
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: 120,
        maxWidth: 120,
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        width: 80,
        Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        show: this.state.windowWidth > 767,
        Cell: data => {
          return <HashLink url={`/blocks/${data.original.parentBlockNumber}`} hash={data.value}/>;
        },
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        show: this.state.windowWidth > 767,
        Cell: function(data) {
          return BlockUtils.formatDifficulty(data.value);
        },
      },
      {
        Header: 'Transactions',
        accessor: 'transactionCount',
      },
    ];
  }

  setPageSize(event) {
    uiStore.setBlocksTablePageSize(Number(event.target.value));
  }

  fetchData(state) {
    this.props.store.fetchBlocks({
      pageSize: uiStore.blocksTablePageSize,
      page: state.page,
      sorted: state.sorted,
    });
  }

  render() {
    const store = this.props.store;
    const numOfPages = Math.ceil(store.blocksCount / uiStore.blocksTablePageSize);
    return (
      <div className="BlocksTable">
        <div className="clearfix">
          {store.medianTime ? <div className="medianTime mb-1 mb-lg-2">{store.medianTimeString}</div> : ''}
          {this.props.title && (
            <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{this.props.title}</h1>
          )}
          <div className="BlocksTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={uiStore.blocksTablePageSize}
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
          resizable={false}
          sortable={false}
          onFetchData={this.fetchData}
          data={store.blocks}
          columns={this.getTableColumns()}
          showPaginationBottom={true}
          defaultPageSize={uiStore.blocksTablePageSize}
          pageSizeOptions={this.props.pageSizes}
          pages={numOfPages}
          page={uiStore.blocksTableCurPage}
          onPageChange={page => {
            uiStore.setBlocksTableCurPage(page);
          }}
          pageSize={uiStore.blocksTablePageSize}
          PaginationComponent={PaginationComponent}
          previousText={<i className="fas fa-angle-double-left"></i>}
          nextText={<i className="fas fa-angle-double-right"></i>}
        />
      </div>
    );
  }
}

BlocksTable.defaultProps = {
  pageSizes: [5, 10, 20, 50, 100],
};

BlocksTable.propTypes = {
  pageSizes: PropTypes.array,
  store: PropTypes.object,
};

export default observer(BlocksTable);
