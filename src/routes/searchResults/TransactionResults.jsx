import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../components/HashLink/HashLink.jsx';

export default class TransactionResults extends Component {
  render() {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>TRANSACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {this.props.items.map((transaction) => (
            <tr key={transaction.hash}>
              <td><HashLink url={`/tx/${transaction.hash}`} hash={transaction.hash} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

TransactionResults.propTypes = {
  items: PropTypes.array,
};
