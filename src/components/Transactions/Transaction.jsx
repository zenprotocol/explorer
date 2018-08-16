import React from 'react';
import PropTypes from 'prop-types';
import TransactionAsset from './Asset/TransactionAsset';
import HashLink from '../HashLink/HashLink.jsx';
import TextUtils from '../../lib/TextUtils.js';

export default function Transaction(props) {
  const { transaction, address, disableTXLinks } = props;
  const timestamp = transaction.Block && transaction.Block.timestamp ? transaction.Block.timestamp : null;
  return (
    <div className="Transaction" key={transaction.id}>
      <div className="hash mb-4 no-text-transform">
        {transaction.isCoinbase ? (
          <span className="coinbase d-inline-block mr-1 text-white font-weight-bold">Coinbase - </span>
        ) : null}
        <HashLink url={disableTXLinks ? '' : `/tx/${transaction.hash}`} hash={transaction.hash} />
        {timestamp? <span className="date float-sm-right d-block text-white">{TextUtils.getDateStringFromTimestamp(timestamp)}</span> : null}
      </div>
      <div className="assets">
        {transaction.assets &&
          transaction.assets.length &&
          transaction.assets.map((asset, assetIndex) => {
            return (
              <TransactionAsset
                transactionAsset={asset}
                asset={asset.asset}
                key={assetIndex}
                showHeader={assetIndex === 0}
                address={address}
                timestamp={timestamp}
                total={address ? asset.addressTotal : asset.total}
              />
            );
          })}
      </div>
    </div>
  );
}

Transaction.propTypes = {
  transaction: PropTypes.object,
  disableTXLinks: PropTypes.bool,
  address: PropTypes.string,
};
Transaction.defaultProps = {
  address: '',
};
