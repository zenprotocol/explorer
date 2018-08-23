import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../components/HashLink/HashLink.jsx';

export default class TransactionResults extends Component {
  render() {
    const {items} = this.props;
    if(!items || !items.length) {
      return null;
    }
    
    return (
      <div className="search-results-group">
        <table className="table">
          <thead>
            <tr>
              <th>TRANSACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.map((transaction) => (
              <tr key={transaction.hash}>
                <td><HashLink url={`/tx/${transaction.hash}`} hash={transaction.hash} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

TransactionResults.propTypes = {
  items: PropTypes.array,
};
