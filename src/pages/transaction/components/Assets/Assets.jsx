import React from 'react';
import PropTypes from 'prop-types';
import { TransactionAsset } from '../../../../components/Transactions';

export default function TransactionAssets(props) {
  const { transaction } = props;
  return (
    <div className="Transaction">
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
                total={Number(asset.total)}
                showAsset={true}
              />
            );
          })}
      </div>
    </div>
  );
}

TransactionAssets.propTypes = {
  transaction: PropTypes.object,
};
