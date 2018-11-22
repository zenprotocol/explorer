import React from 'react';
import PropTypes from 'prop-types';
import HashLink from '../HashLink';
import AddressUtils from '../../lib/AddressUtils';

/**
 * A wrapper around HashLink that sets the url to address/contracts
 */
export default function AddressLink({ active, address, ...rest }) {
  const url = AddressUtils.isContract(address) ? `/contracts/${address}` : `/address/${address}`;
  return <HashLink url={active ? url : ''} {...rest} />;
}

AddressLink.propTypes = {
  active: PropTypes.bool,
  address: PropTypes.string.isRequired,
};
AddressLink.defaultProps = {
  active: true,
};
