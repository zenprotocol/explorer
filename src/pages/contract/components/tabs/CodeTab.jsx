import React from 'react';
import { observer, inject } from 'mobx-react';
import Highlight from 'react-highlight';
import fileDownload from 'js-file-download';
import { TabPanel } from '../../../../components/tabs';
import Loading from '../../../../components/Loading';
import Button from '../../../../components/buttons/Button';

export default inject('rootStore')(observer(function CodeTab(props) {
  const { contractStore } = props.rootStore;
  if (contractStore.loading.contract) {
    return <Loading />;
  }
  return (
    <TabPanel>
      <Highlight className="fsharp">{contractStore.contract.code}</Highlight>
      <Button size="sm" onClick={() => download(contractStore.contract)}>Download contract</Button>
    </TabPanel>
  );
}));

function download(contract) {
  fileDownload(contract.code, `${contract.id}.fst`);
}