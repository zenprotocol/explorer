import React, { Component } from 'react';
import { observer } from 'mobx-react';
import blockStore from '../../store/BlockStore';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import './Transactions.css';
import Transaction from './Transaction.jsx';
import Loading from '../Loading';

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transactions: [],
      hasMoreItems: true,
    };

    this.loadItems = this.loadItems.bind(this);
  }

  componentDidMount() {
    this.loadItems(0);
  }

  componentDidUpdate(prevProps) {
    const { blockNumber, address, order } = this.props;
    if (blockNumber !== prevProps.blockNumber || address !== prevProps.address || order !== prevProps.order) {
      this.setState({ transactions: [] }, () => {
        this.loadItems(0);
      });
    }
  }

  render() {
    if (!this.state.transactions.length) {
      return <Loading />;
    }
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
    const { blockNumber, address, order } = this.props;
    const firstTransactionId = this.state.transactions.length
      ? order === 'asc'
        ? this.state.transactions[this.state.transactions.length - 1].id
        : this.state.transactions[0].id
      : 0;

    let params = { blockNumber, address, page, order, firstTransactionId };
    blockStore.fetchTransactions(params).then(() => {
      const transactions =
        page > 0 ? this.state.transactions.concat(blockStore.transactions) : blockStore.transactions;
      this.setState({ transactions });
    });
  }
}

Transactions.propTypes = {
  disableTXLinks: PropTypes.bool,
  blockNumber: PropTypes.number,
  address: PropTypes.string,
  order: PropTypes.oneOf(['asc', 'desc']),
};

export default observer(Transactions);
