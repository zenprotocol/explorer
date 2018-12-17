import React from 'react';
import { observer, inject } from 'mobx-react';
import Highlight from 'react-highlight';
import { TabPanel } from '../../../../components/tabs';
import Loading from '../../../../components/Loading';

export default inject('rootStore')(observer(function CodeTab(props) {
  const { contractStore } = props.rootStore;
  if (contractStore.loading.contract) {
    return <Loading />;
  }
  return (
    <TabPanel>
      <Highlight className="fsharp">{contractStore.contract.code}</Highlight>
    </TabPanel>
  );
}));
