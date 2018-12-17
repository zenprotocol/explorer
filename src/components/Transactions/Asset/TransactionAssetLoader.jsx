import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import TransactionAsset from './TransactionAsset.jsx';
import Loading from '../../Loading';

class TransactionAssetLoader extends Component {
  componentDidMount() {
    const { transactionAssets, index, rootStore } = this.props;
    if (!this.transactionAssetAlreadyLoaded) {
      rootStore.transactionStore.fetchTransactionAsset(transactionAssets, index);
    }
  }
  render() {
    const { index, address, addressFoundIn, transactionAssets, total } = this.props;
    if (!this.transactionAssetAlreadyLoaded) {
      return <Loading />;
    }

    return (
      <TransactionAsset
        transactionAsset={transactionAssets[index].TransactionAsset}
        asset={transactionAssets[index].asset}
        showHeader={true}
        address={address}
        addressFoundIn={addressFoundIn}
        total={total}
      />
    );
  }

  get transactionAssetAlreadyLoaded() {
    const { index, transactionAssets } = this.props;
    return !!transactionAssets[index].TransactionAsset;
  }
}

TransactionAssetLoader.propTypes = {
  transactionAssets: PropTypes.array,
  index: PropTypes.number,
  address: PropTypes.string,
  addressFoundIn: PropTypes.array,
  total: PropTypes.number,
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(TransactionAssetLoader));
