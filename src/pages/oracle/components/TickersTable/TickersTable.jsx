import React from 'react';
import PropTypes from 'prop-types';
import ItemsTable from '../../../../components/ItemsTable';

export default function TickersTable({items, count, pageSize, curPage, tableDataSetter, loading}) {
  return (
    <ItemsTable
      columns={TABLE_COLUMNS}
      hideOnMobile={[]}
      loading={loading}
      itemsCount={count}
      items={items}
      pageSize={pageSize}
      curPage={curPage}
      tableDataSetter={tableDataSetter}
    />
  );
}
TickersTable.propTypes = {
  items: PropTypes.array,
  count: PropTypes.number,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func,
};

const TABLE_COLUMNS = [
  {
    Header: 'SYMBOL',
    accessor: 'ticker',
  },
  {
    Header: 'PRICE',
    accessor: 'value',
    Cell: data => (
      <span className={Number(data.value) < 0 ? 'negative' : 'positive'}>{data.value}</span>
    ),
  },
];
