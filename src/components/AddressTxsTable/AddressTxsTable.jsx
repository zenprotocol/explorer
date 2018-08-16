import React from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import TxsAssetsTable from '../TxsAssetsTable/TxsAssetsTable.jsx';

function AddressTxsTable() {
  return (
    <TxsAssetsTable
      columns={['asset', 'blockHash', 'txHash', 'isCoinbaseTx', 'timestamp', 'totalSum']}
      hideOnMobile={['blockHash', 'isCoinbaseTx']}
      loading={blockStore.loading.addressTransactionAssets}
      assetCount={blockStore.addressTransactionAssetsCount}
      assets={blockStore.addressTransactionAssets}
      pageSize={uiStore.addressTxTable.pageSize}
      curPage={uiStore.addressTxTable.curPage}
      tableDataSetter={uiStore.setAddressTxTableData.bind(uiStore)}
    />
  );
}

export default observer(AddressTxsTable);
