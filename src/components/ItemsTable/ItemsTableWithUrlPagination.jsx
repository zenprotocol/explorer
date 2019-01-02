import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { ItemsTable } from './index';
import UrlPaginationReflector from '../UrlPaginationReflector';

function ItemsTableWithUrlPagination(props) {
  const { tableDataSetter, dataTable, itemsCount } = props;
  const { curPage, pageSize } = dataTable;
  const hasNext = (curPage + 1) * pageSize < itemsCount;
  const hasPrev = curPage > 0;
  return (
    <React.Fragment>
      <Helmet>
        {hasNext && <link rel="next" href={`${props.location.pathname}?p=${curPage+2}&s=${pageSize}`} />}
        {hasPrev && <link rel="prev" href={`${props.location.pathname}?p=${curPage}&s=${pageSize}`} />}
      </Helmet>
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
