import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import TextUtils from '../../lib/TextUtils';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import BlockUtils from '../../lib/BlockUtils';
import Config from '../../lib/Config';
import GenericTable from '../GenericTable/GenericTable.jsx';
import HashLink from '../HashLink/HashLink.jsx';
import './BlocksTable.css';

class BlocksTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      windowWidth: 0,
    };

    this.setPageSize = this.setPageSize.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
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
        show: this.state.windowWidth >= Config.ui.sizes.breakpointMd,
        Cell: data => {
          return <HashLink url={`/blocks/${data.original.parent}`} hash={data.value}/>;
        },
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        show: this.state.windowWidth >= Config.ui.sizes.breakpointMd,
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
    const pageSize = Number(event.target.value);
    const curPage = Math.floor((uiStore.blocksTable.pageSize * uiStore.blocksTable.curPage) / pageSize);
    uiStore.setBlocksTableData({pageSize, curPage});
  }

  onPageChange(page) {
    uiStore.setBlocksTableData({curPage: page});
  }

  render() {
    const numOfPages = Math.ceil(blockStore.blocksCount / uiStore.blocksTable.pageSize);
    return (
      <div className="BlocksTable">
        <div className="clearfix">
          {blockStore.medianTime ? <div className="medianTime mb-1 mb-lg-2">{blockStore.medianTimeString}</div> : ''}
          {this.props.title && (
            <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{this.props.title}</h1>
          )}
          <div className="BlocksTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={uiStore.blocksTable.pageSize}
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
        <GenericTable
          loading={blockStore.loading.blocks}
          data={blockStore.blocks}
          columns={this.getTableColumns()}
          defaultPageSize={uiStore.blocksTable.pageSize}
          pages={numOfPages}
          page={uiStore.blocksTable.curPage}
          pageSizes={this.props.pageSizes}
          onPageChange={this.onPageChange}
          pageSize={uiStore.blocksTable.pageSize}
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
};

export default observer(BlocksTable);
