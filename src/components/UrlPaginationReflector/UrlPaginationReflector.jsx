import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import config from '../../lib/Config';

/**
 * Reflects the data in the supplied observable dataTable into the url search params
 * Sets the table data from the search params on change
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

  componentDidUpdate({location: prevLocation}) {
    // responsible for both when search changes (back/forward buttons) AND dataTable changes
    if(prevLocation.search !== this.props.location.search) {
      this.updateTableDataFromSearchParams();
      this.updateLastData(this.props.dataTable);
    }
    else {
      this.updateSearchParamsOnTableDataChange();
    }
  }

  updateTableDataFromSearchParams() {
    this.props.tableDataSetter(this.paginationParams);
  }

  updateSearchParamsOnTableDataChange() {
    const { curPage, pageSize } = this.props.dataTable;
    const numOfPages = Math.ceil(this.props.itemsCount / pageSize);
    if (numOfPages > 1) {
      const currentPathname = this.props.location.pathname;
      const firstLoad = Object.keys(this.lastData).length === 0;
      if (this.lastData.curPage !== curPage || this.lastData.pageSize !== pageSize) {
        this.updateLastData({ curPage, pageSize });
        if(!firstLoad) {
          this.props.history.push({
            pathname: currentPathname,
            search: `?p=${curPage + 1}&s=${pageSize}`,
          });
        }
      }
    }
  }

  updateLastData({ curPage, pageSize }) {
    this.lastData = { curPage, pageSize };
  }

  get paginationParams() {
    return {
      curPage: this.safePage - 1,
      pageSize: this.safePageSize,
    };
  }

  get searchParams() {
    let params = new URLSearchParams(this.props.location.search);
    return {
      curPage: params.get('p'),
      pageSize: params.get('s'),
    };
  }

  get safePage() {
    const { curPage } = this.searchParams;
    let safePage = Number(curPage);
    return isNaN(safePage) || safePage < 1 ? 1 : safePage;
  }

  get safePageSize() {
    const { pageSize } = this.searchParams;
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
  itemsCount: PropTypes.number,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

UrlPaginationReflector.defaultProps = {
  itemsCount: 0,
};

export default observer(UrlPaginationReflector);
