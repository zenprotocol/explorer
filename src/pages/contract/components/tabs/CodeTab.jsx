import React from 'react';
import { observer } from 'mobx-react';
import Highlight from 'react-highlight';
import contractStore from '../../../../store/ContractStore';
import { TabPanel } from '../../../../components/tabs';
import Loading from '../../../../components/Loading';

export default observer(function CodeTab() {
  if (contractStore.loading.contract) {
    return <Loading />;
  }
  return (
    <TabPanel>
      <Highlight className="fsharp">{contractStore.contract.code}</Highlight>
    </TabPanel>
  );
});
