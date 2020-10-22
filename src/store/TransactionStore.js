import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/ApiService';

export default class TransactionStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.transactions = initialState.transactions || [];
    this.transactionsCount = initialState.transactionsCount || 0;
    this.transaction = initialState.transaction || null;
    this.loading = {
      transaction: false,
      transactions: false,
    };
  }

  fetchTransaction(hash) {
    if(this.transaction && this.transaction.hash === hash) {
      return Promise.resolve(this.transaction);
    }
    
    this.loading.transaction = true;

    return Service.txs
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
    return Service.txs
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

  /**
   * Fetch all assets in a tx
   * @param {Array} transactions - a transactions list
   * @param {Array} index - the index in the transactions list
   * @param {Object} params - extra params for the fetch like address
   */
  fetchTxAssets(transactions, index, params) {
    const tx =
      (transactions || []).length > index ? transactions[index] : null;
    if (tx) {
      return Service.txs
        .findAssets(tx.hash, params)
        .then(response => {
          runInAction(() => {
            transactions[index].assets = response.data.items;
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
  fetchTxAssets: action,
});
