import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

class TransactionStore {
  constructor() {
    this.transactions = [];
    this.transactionsCount = 0;
    this.transaction = null;
    this.loading = {
      transaction: false,
      transactions: false,
    };
  }
  fetchTransaction(hash) {
    this.loading.transaction = true;

    return Service.transactions
      .findByHash(hash)
      .then(response => {
        const transaction = response.data;
        runInAction(() => {
          this.transaction = transaction;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.transaction = false;
        });
        return this.transaction;
      });
  }

  fetchTransactions(params = {}) {
    this.loading.transactions = true;
    return Service.transactions
      .find(params)
      .then(response => {
        runInAction(() => {
          this.transactions = response.data.items;
          this.transactionsCount = response.data.total;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.transactions = false;
        });
      });
  }

  fetchTransactionAsset(transactionAssets, index) {
    const transactionAsset =
      (transactionAssets || []).length > index ? transactionAssets[index] : null;
    if (transactionAsset) {
      return Service.transactions
        .findAsset(transactionAsset.transactionId, transactionAsset.asset)
        .then(response => {
          runInAction(() => {
            transactionAssets[index].TransactionAsset = response.data;
          });
        });
    }
    return Promise.resolve();
  }
}

decorate(TransactionStore, {
  transaction: observable,
  transactions: observable,
  transactionsCount: observable,
  loading: observable,
  fetchTransaction: action,
  fetchTransactions: action,
  fetchTransactionAsset: action,
});

export default new TransactionStore();
