import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../components/HashLink/HashLink';

export default class AddressResults extends Component {
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
              <th>ADDRESSES</th>
            </tr>
          </thead>
          <tbody>
            {items.map((address) => (
              <tr key={address.address}>
                <td><HashLink url={`/address/${address.address}`} hash={address.address} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

AddressResults.propTypes = {
  items: PropTypes.array,
};
