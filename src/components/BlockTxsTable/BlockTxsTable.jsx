import React from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import TxsAssetsTable from '../TxsAssetsTable/TxsAssetsTable.jsx';

function BlockTxsTable() {
  return (
    <TxsAssetsTable
      columns={['asset', 'txHash', 'isCoinbaseTx', 'timestamp', 'totalSum']}
      loading={blockStore.loading.blockTransactionAssets}
      assetCount={blockStore.blockTransactionAssetsCount}
      assets={blockStore.blockTransactionAssets}
      pageSize={uiStore.blockTxTable.pageSize}
      curPage={uiStore.blockTxTable.curPage}
      tableDataSetter={uiStore.setBlockTxTableData.bind(uiStore)}
    />
  );
}

export default observer(BlockTxsTable);
