import React from 'react';
import PropTypes from 'prop-types';
import {ItemsTable} from './index';
import UrlPaginationReflector from '../UrlPaginationReflector';

function ItemsTableWithUrlPagination (props) {
  const {tableDataSetter, dataTable, itemsCount} = props;
  return (
    <React.Fragment>
      <UrlPaginationReflector
        tableDataSetter={tableDataSetter}
        dataTable={dataTable}
        itemsCount={itemsCount}
        location={props.location}
        history={props.history}
      />
      <ItemsTable {...props} />
    </React.Fragment>
  );
}

ItemsTableWithUrlPagination.propTypes = {
  tableDataSetter: PropTypes.func.isRequired,
  dataTable: PropTypes.object.isRequired,
  itemsCount: PropTypes.number,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default ItemsTableWithUrlPagination;