import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import config from '../../lib/Config';

/**
 * Reflects the data in the supplied observable dataTable into the url search params
 * Sets the table data from the search params on first load
 * dependant on mobx
 */
class UrlPaginationReflector extends React.Component {
  constructor(props) {
    super(props);

    this.lastData = {};
  }

  componentDidMount() {
    this.updateTableDataFromSearchParams();
  }

  componentDidUpdate() {
    this.updateSearchParamsOnTableDataChange();
  }

  updateTableDataFromSearchParams() {
    this.props.tableDataSetter(this.searchParams);
  }

  updateSearchParamsOnTableDataChange() {
    const { curPage, pageSize } = this.props.dataTable;
    const currentPathname = this.props.location.pathname;
    if (this.lastData.curPage !== curPage || this.lastData.pageSize !== pageSize) {
      this.lastData = { curPage, pageSize };
      this.props.history.push({ pathname: currentPathname, search: `?p=${curPage + 1}&s=${pageSize}` });
    }
  }

  get searchParams() {
    let params = new URLSearchParams(this.props.location.search);
    const curPage = this.safePage(params.get('p')) - 1;
    const pageSize = this.safePageSize(params.get('s'));
    return {
      curPage,
      pageSize,
    };
  }

  safePage(page) {
    let safePage = Number(page);
    return isNaN(safePage) || safePage < 1 ? 1 : safePage;
  }

  safePageSize(pageSize) {
    let safeSize = Number(pageSize);
    return isNaN(safeSize) || !config.ui.table.pageSizes.includes(safeSize)
      ? this.props.dataTable.pageSize || config.ui.table.defaultPageSize
      : safeSize;
  }

  render() {
    return null;
  }
}

UrlPaginationReflector.propTypes = {
  dataTable: PropTypes.object.isRequired,
  tableDataSetter: PropTypes.func.isRequired,
  location: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(observer(UrlPaginationReflector));
