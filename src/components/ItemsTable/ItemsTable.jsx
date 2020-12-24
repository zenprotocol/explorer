import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import classNames from 'classnames';
import config from '../../lib/Config';
import GenericTable from '../GenericTable';
import Dropdown from '../Dropdown';
import './ItemsTable.scss';

class ItemsTable extends Component {
  constructor() {
    super();

    this.state = {
      windowWidth: 1000,
      expanded: {},
    };

    this.setPageSize = this.setPageSize.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.onSortedChange = this.onSortedChange.bind(this);
    this.setWindowWidth = this.setWindowWidth.bind(this);
    this.setWindowWidthThrottled = throttle(this.setWindowWidth, 200);
  }

  componentDidMount() {
    this.setWindowWidth();
    window.addEventListener('resize', this.setWindowWidthThrottled, false);
  }

  componentWillUnmount() {
    this.setWindowWidthThrottled.cancel();
    window.removeEventListener('resize', this.setWindowWidthThrottled, false);
  }

  componentDidUpdate(prevProps) {
    const { items, curPage } = this.props;
    if (items !== prevProps.items || curPage !== prevProps.curPage) {
      this.setState({ expanded: {} });
    }
  }

  setWindowWidth() {
    this.setState({ windowWidth: window.innerWidth });
  }

  getTableColumns() {
    const expander = {
      expander: true,
      width: 65,
      Expander: ({ isExpanded }) => (
        <div className="expand">
          <div className="arrow">
            {isExpanded ? (
              <i className="expand-icon fas fa-angle-up" />
            ) : (
              <i className="expand-icon fas fa-angle-down" />
            )}
          </div>
        </div>
      ),
    };

    const defaultMinWidth = this.state.windowWidth >= config.ui.sizes.breakpointLg ? 100 : 120;

    const addShow = column =>
      Object.assign(
        {},
        column,
        column.hideOnMobile ? { show: this.state.windowWidth >= config.ui.sizes.breakpointMd } : {}
      );

    const setWidth = column =>
      Object.assign({}, column, { minWidth: column.minWidth || defaultMinWidth });

    const columns = this.props.columns.map(column => setWidth(addShow(column)));

    if (this.props.SubComponent) {
      columns.push(expander);
    }
    return columns;
  }

  setPageSize(selected) {
    const { pageSize, curPage, tableDataSetter } = this.props;
    const newPageSize = Number(selected.value);
    const newCurPage = Math.floor((pageSize * curPage) / newPageSize);
    tableDataSetter({ pageSize: newPageSize, curPage: newCurPage });
  }

  onPageChange(page) {
    this.props.tableDataSetter({ curPage: page });
  }

  onSortedChange(sorted) {
    this.props.tableDataSetter({ sorted });
  }

  render() {
    const {
      loading,
      itemsCount,
      items,
      pageSize,
      curPage,
      SubComponent,
      topContent,
      multiSort,
      defaultSorted,
      defaultSortDesc,
      getTrProps,
      minRows,
    } = this.props;
    const numOfPages = Math.ceil(itemsCount / pageSize);
    const showPageSizes = itemsCount > config.ui.table.pageSizes[0];
    const showTopRow = showPageSizes || topContent;

    return (
      <div className={classNames('ItemsTable', { loading })}>
        {showTopRow && (
          <div className="ItemsTable-top row align-items-end mb-3 mb-lg-5">
            <div className="col-md-8 mb-3 mb-lg-0">{topContent}</div>
            <div className="col-md-4">
              {showPageSizes && (
                <div className="ItemsTable-pageSizes form-inline float-right">
                  <span className="mr-2 d-none d-md-inline-block">SHOW</span>
                  <Dropdown
                    options={config.ui.table.pageSizes}
                    value={String(pageSize)}
                    onChange={this.setPageSize}
                  />
                  <span className="ml-2 d-none d-md-inline-block">ENTRIES</span>
                </div>
              )}
            </div>
          </div>
        )}
        <GenericTable
          loading={loading}
          data={items}
          columns={this.getTableColumns()}
          defaultPageSize={pageSize}
          pages={numOfPages}
          page={curPage}
          pageSizes={config.ui.table.pageSizes}
          onPageChange={this.onPageChange}
          onSortedChange={this.onSortedChange}
          pageSize={pageSize}
          multiSort={multiSort}
          defaultSorted={defaultSorted}
          defaultSortDesc={defaultSortDesc}
          SubComponent={SubComponent}
          expanded={this.state.expanded}
          minRows={minRows}
          getTrProps={(state, rowInfo, column, instance) => {
            const expanded = rowInfo && state.expanded[rowInfo.index] === true;
            const trProps = {
              className: classNames({ expandable: SubComponent, expanded }),
              onClick: (e, handleOriginal) => {
                const tagName = e.target.tagName.toLowerCase();
                const expandableTags = ['div', 'span'];
                if (
                  SubComponent &&
                  (expandableTags.includes(tagName) || e.target.classList.contains('expand-icon'))
                ) {
                  this.setState(prevState => ({
                    expanded: {
                      [rowInfo.index]: !prevState.expanded[rowInfo.index],
                    },
                  }));
                }
                if (handleOriginal) {
                  handleOriginal();
                }
              },
            };
            const finalTrProps = typeof getTrProps === 'function' ? getTrProps(state, rowInfo, column, instance, trProps) : trProps;
            return finalTrProps;
          }}
        />
      </div>
    );
  }
}

ItemsTable.defaultProps = {
  pageSize: config.ui.table.defaultPageSize,
  curPage: 0,
  tableDataSetter: () => {},
  minRows: 0,
};

ItemsTable.propTypes = {
  columns: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  itemsCount: PropTypes.number,
  items: PropTypes.array,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func,
  SubComponent: PropTypes.any,
  topContent: PropTypes.any,
  multiSort: PropTypes.bool,
  defaultSorted: PropTypes.array,
  defaultSortDesc: PropTypes.bool,
  getTrProps: PropTypes.func,
  minRows: PropTypes.number,
};

export default observer(ItemsTable);
