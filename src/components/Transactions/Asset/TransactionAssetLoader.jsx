import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import TransactionAsset from './TransactionAsset.jsx';
import Loading from '../../Loading';

class TransactionAssetLoader extends Component {
  componentDidMount() {
    const { transactions, index, rootStore, address, asset } = this.props;
    if (!this.txAssetsAlreadyLoaded) {
      rootStore.transactionStore.fetchTxAssets(transactions, index, { address, asset });
    }
  }
  render() {
    const { index, address, transactions, total, showAsset } = this.props;
    if(!transactions || !transactions.length) {
      return null;
    }
    if (!this.txAssetsAlreadyLoaded) {
      return <Loading />;
    }
    return transactions[index].assets.map((asset, index) => (
      <TransactionAsset
        key={asset.asset}
        transactionAsset={asset}
        asset={asset.asset}
        showHeader={index === 0}
        showAsset={showAsset}
        address={address}
        total={total}
      />
    ));
  }

  get txAssetsAlreadyLoaded() {
    const { index, transactions } = this.props;
    return !!transactions[index].assets;
  }
}

TransactionAssetLoader.propTypes = {
  transactions: PropTypes.array,
  index: PropTypes.number,
  address: PropTypes.string,
  asset: PropTypes.string,
  addressFoundIn: PropTypes.array,
  total: PropTypes.number,
  rootStore: PropTypes.object,
  showAsset: PropTypes.bool,
};
TransactionAssetLoader.defaultProps = {
  showAsset: true,
};

export default inject('rootStore')(observer(TransactionAssetLoader));
