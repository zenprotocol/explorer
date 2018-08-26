import React from 'react';
import ReactTable, {ReactTableDefaults} from 'react-table';
import PropTypes from 'prop-types';
import 'react-table/react-table.css';
import PaginationComponent from './Pagination.jsx';
import LoadingWithBG from './LoadingWithBG.jsx';
import './GenericTable.css';

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
    SubComponent
  } = props;
  return (
    <div className="GenericTable">
      <ReactTable 
        manual
        loading={loading}
        resizable={resizable}
        sortable={sortable}
        data={data}
        column={{...ReactTableDefaults.column, minWidth: 130}}
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
};

GenericTable.defaultProps = {
  pageSizes: [5, 10, 20, 50, 100],
  resizable: false,
  sortable: false,
  defaultPageSize: 10,
  page: 0,
};
