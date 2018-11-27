import React from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../store/RootStore';
import Button from '../buttons/Button';
import './TestnetBar.scss';

function TestnetBar() {
  if(!rootStore.isTestnet) {
    return null;
  }
  return (
    <div className="TestnetBar container-fluid d-flex justify-content-center align-items-center">
      <div className="mr-3">You are currently exploring the TESTNET</div>
      <Button size="sm" type="blue-hard" className="btn-thin btn-hover-border" href="https://zp.io">Switch to Mainnet</Button>
    </div>
  );
}

export default observer(TestnetBar);
