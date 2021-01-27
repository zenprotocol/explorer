/* eslint-disable react/display-name */
import React from 'react';
import config from '../../../../lib/Config';
import AssetUtils from '../../../../lib/AssetUtils';
import GenericTable from '../../../../components/GenericTable';
import HashLink from '../../../../components/HashLink';

export default function getSubComponent(type) {
  if (type === 'allocation') return null;

  return (row) => {
    const { spends } = row.original.content;
    return (
      <div className="spends">
        <GenericTable
          loading={false}
          data={spends}
          columns={[
            {
              Header: 'ASSET',
              accessor: 'asset',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) => (
                <HashLink
                  hash={AssetUtils.getAssetNameFromCode(value)}
                  value={value}
                  url={`/assets/${value}`}
                />
              ),
            },
            {
              Header: 'AMOUNT',
              accessor: 'amount',
              minWidth: config.ui.table.minCellWidth,
              Cell: (data) => `${AssetUtils.getAmountDivided(data.value)}`,
            },
          ]}
          defaultPageSize={spends.length}
          pages={1}
          page={0}
          pageSize={spends.length}
        />
      </div>
    );
  };
}
