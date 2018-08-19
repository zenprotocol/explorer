import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import Config from '../../lib/Config';
import GenericTable from '../GenericTable/GenericTable';
import './ItemsTable.css';

class ItemsTable extends Component {
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

  componentWillUnmount() {
    window.removeEventListener('resize', this.setWindowWidth);
  }

  setWindowWidth() {
    this.setState({ windowWidth: window.innerWidth });
  }

  getTableColumns() {
    const expander = {
      Header: 'Expand',
      expander: true,
      width: 65,
      Expander: ({ isExpanded }) => (
        <div className="expand">
          {isExpanded ? <i className="fas fa-angle-up" /> : <i className="fas fa-angle-down" />}
        </div>
      ),
    };

    const columns = this.props.columns.map(column => {
      const hideOnMobileObj = this.props.hideOnMobile.includes(column.accessor)
        ? { show: this.state.windowWidth >= Config.ui.sizes.breakpointMd }
        : {};
      return Object.assign({}, column, hideOnMobileObj);
    });

    if(this.props.SubComponent) {
      columns.push(expander);
    }
    return columns;
  }

  setPageSize(event) {
    const { pageSize, curPage, tableDataSetter } = this.props;
    const newPageSize = Number(event.target.value);
    const newCurPage = Math.floor((pageSize * curPage) / newPageSize);
    tableDataSetter({ pageSize: newPageSize, curPage: newCurPage });
  }

  onPageChange(page) {
    this.props.tableDataSetter({ curPage: page });
  }

  render() {
    const { loading, itemsCount, items, pageSize, curPage, SubComponent, title } = this.props;
    const numOfPages = Math.ceil(itemsCount / pageSize);

    return (
      <div className={classNames('ItemsTable', { loading })}>
        <div className="clearfix">
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{title}</h1>
          <div className="ItemsTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={pageSize}
              onChange={this.setPageSize}
              className="form-control d-block d-md-inline-block"
            >
              {Config.ui.table.pageSizes.map(pageSize => {
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
          loading={loading}
          data={items}
          columns={this.getTableColumns()}
          defaultPageSize={pageSize}
          pages={numOfPages}
          page={curPage}
          pageSizes={Config.ui.table.pageSizes}
          onPageChange={this.onPageChange}
          pageSize={pageSize}
          SubComponent={SubComponent}
        />
      </div>
    );
  }
}

ItemsTable.defaultProps = {
  hideOnMobile: [],
  pageSize: 10,
  curPage: 0,
};

ItemsTable.propTypes = {
  columns: PropTypes.array.isRequired,
  hideOnMobile: PropTypes.array,
  loading: PropTypes.bool,
  itemsCount: PropTypes.number,
  items: PropTypes.array,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func.isRequired,
  SubComponent: PropTypes.any,
  title: PropTypes.any,
};

export default observer(ItemsTable);
