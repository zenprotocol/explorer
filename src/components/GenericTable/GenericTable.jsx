import React from 'react';
import ReactTable from 'react-table';
import PropTypes from 'prop-types';
import config from '../../lib/Config';
import PaginationComponent from './Pagination.jsx';
import LoadingWithBG from './LoadingWithBG.jsx';
import 'react-table/react-table.css';
import './GenericTable.scss';

export default function GenericTable(props) {
  const {
    loading,
    pageSizes,
    resizable,
    sortable,
    onFetchData,
    data,
    columns,
    defaultPageSize,
    pages,
    page,
    pageSize,
    onPageChange,
    SubComponent,
    pivotBy,
    expanded,
    getTrProps,
  } = props;
  return (
    <div className="GenericTable">
      <ReactTable
        manual
        loading={loading}
        resizable={resizable}
        sortable={sortable}
        data={data}
        columns={columns}
        onFetchData={onFetchData}
        showPaginationBottom={true}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizes}
        pages={pages}
        page={page}
        pageSize={pageSize}
        onPageChange={onPageChange}
        PaginationComponent={PaginationComponent}
        LoadingComponent={LoadingWithBG}
        previousText={<i className="fas fa-angle-double-left" />}
        nextText={<i className="fas fa-angle-double-right" />}
        SubComponent={SubComponent}
        pivotBy={pivotBy}
        expanded={expanded}
        getTableProps={(state, rowInfo, column, instance) => {
          return { className: 'table-zen' };
        }}
        getTrProps={getTrProps}
        getTrGroupProps={(state, rowInfo, column, instance) => {
          if (!rowInfo) {
            return {};
          }
          // mark last data row before pad rows
          const dataLength = state.data.length;
          const rowIndex = rowInfo.index;
          return { className: rowIndex === dataLength - 1 ? 'last' : '' };
        }}
      />
    </div>
  );
}

GenericTable.propTypes = {
  loading: PropTypes.bool,
  pageSizes: PropTypes.array,
  resizable: PropTypes.bool,
  sortable: PropTypes.bool,
  data: PropTypes.array,
  columns: PropTypes.array,
  onFetchData: PropTypes.func,
  defaultPageSize: PropTypes.number,
  pages: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func,
  SubComponent: PropTypes.any,
  pivotBy: PropTypes.array,
  expanded: PropTypes.object,
  getTrProps: PropTypes.func,
};

GenericTable.defaultProps = {
  pageSizes: config.ui.table.pageSizes,
  resizable: false,
  sortable: false,
  defaultPageSize: config.ui.table.defaultPageSize,
  page: 0,
};
