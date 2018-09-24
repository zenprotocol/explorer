import React from 'react';
import PropTypes from 'prop-types';

export default function Page(props) {
  return (
    <div className="Page">
      {props.children}
    </div>
  );
}

Page.propTypes = {
  children: PropTypes.any,
};