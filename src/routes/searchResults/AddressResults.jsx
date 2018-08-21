import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HashLink from '../../components/HashLink/HashLink';

export default class AddressResults extends Component {
  render() {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>ADDRESSES</th>
          </tr>
        </thead>
        <tbody>
          {this.props.items.map((address) => (
            <tr key={address.address}>
              <td><HashLink url={`/address/${address.address}`} hash={address.address} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

AddressResults.propTypes = {
  items: PropTypes.array,
};
