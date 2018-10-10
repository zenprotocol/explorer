import React, { Component } from 'react';
import {observer} from 'mobx-react';
import PropTypes from 'prop-types';
import transactionStore from '../../../store/TransactionStore';
import TransactionAsset from './TransactionAsset.jsx';
import Loading from '../../Loading';

class TransactionAssetLoader extends Component {
  componentDidMount() {
    const { transactionAssets, index } = this.props;
    if (!this.transactionAssetAlreadyLoaded) {
      transactionStore.fetchTransactionAsset(transactionAssets, index);
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
};

export default observer(TransactionAssetLoader);
