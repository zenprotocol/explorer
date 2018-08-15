import React, { Component } from 'react';
import {observer} from 'mobx-react';
import PropTypes from 'prop-types';
import blockStore from '../../../store/BlockStore';
import TransactionAsset from './TransactionAsset';
import Loading from '../../Loading/Loading.jsx';

class TransactionAssetLoader extends Component {
  componentDidMount() {
    const { transactionAssets, index } = this.props;
    if (!this.transactionAssetAlreadyLoaded) {
      blockStore.fetchTransactionAsset(transactionAssets, index);
    }
  }
  render() {
    const { index, address, addressFoundIn, timestamp, transactionAssets, total } = this.props;
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
        timestamp={timestamp}
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
  timestamp: PropTypes.string,
  total: PropTypes.string,
};

export default observer(TransactionAssetLoader);
