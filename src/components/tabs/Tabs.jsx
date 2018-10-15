import React from 'react';
import PropTypes from 'prop-types';
import './Tabs.css';

export default function Tabs({ children }) {
  return <div className="Tabs">{children}</div>;
}

Tabs.propTypes = {
  children: PropTypes.any,
};
