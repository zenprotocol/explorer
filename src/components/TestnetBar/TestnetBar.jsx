import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import Button from '../buttons/Button';
import './TestnetBar.scss';

function TestnetBar(props) {
  const { infoStore } = props.rootStore;
  if (!infoStore.isTestnet) {
    return null;
  }
  return (
    <div className="TestnetBar container-fluid d-flex justify-content-center align-items-center">
      <Helmet>
        <body className="testnet" />
      </Helmet>
      <div className="mr-3">You are currently exploring the TESTNET</div>
      <Button size="sm" type="blue-hard" className="btn-thin btn-hover-border" href="https://zp.io">
        Switch to Mainnet
      </Button>
    </div>
  );
}

TestnetBar.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(TestnetBar));
