import React from 'react';
import PropTypes from 'prop-types';

export default function ItemNotFound(props) {
  return <div className="ItemNotFound text-center">This {props.item} was not found</div>;
}

ItemNotFound.propTypes = {
  item: PropTypes.string,
};
