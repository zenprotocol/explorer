import React from 'react';
import PropTypes from 'prop-types';

export default function TabBody({ children }) {
  return <div className="Tabs-body">{children}</div>;
}

TabBody.propTypes = {
  children: PropTypes.any,
};
