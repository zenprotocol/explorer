import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import blockStore from '../../store/BlockStore';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import './Transactions.css';
import Transaction from './Transaction.jsx';
import Loading from '../Loading/Loading';

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transactions: [],
      hasMoreItems: true,
      page: 0,
    };

    this.loadItems = this.loadItems.bind(this);
  }

  componentDidMount() {
    this.loadItems(0);
  }

  render() {
    const { address, disableTXLinks } = this.props;

    const items = this.state.transactions.map((transaction, index) => {
      return (
        <Transaction
          key={transaction.id}
          transaction={transaction}
          disableTXLinks={disableTXLinks}
          address={address}
        />
      );
    });

    if (!items.length) return null;

    const loader = <Loading key={15003} />;
    return (
      <InfiniteScroll
        pageStart={0}
        loadMore={this.loadItems}
        hasMore={items.length < blockStore.transactionsCount}
        initialLoad={false}
        loader={loader}
        threshold={250}
      >
        <div className="Transactions">{items}</div>
      </InfiniteScroll>
    );
  }

  loadItems(page) {
    const { blockNumber, address } = this.props;
    const firstTransactionId = this.state.transactions.length
      ? this.state.transactions[0].id
      : 0;
    let params = { blockNumber, address, page, firstTransactionId };
    blockStore.fetchTransactions(params).then(() => {
      const transactions = this.state.transactions.concat(blockStore.transactions);
      this.setState({ transactions });
    });
  }
}

Transactions.propTypes = {
  disableTXLinks: PropTypes.bool,
  blockNumber: PropTypes.number,
  address: PropTypes.string,
};

export default observer(Transactions);
