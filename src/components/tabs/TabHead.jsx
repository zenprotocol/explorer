import React from 'react';
import PropTypes from 'prop-types';

export default function TabHead({ children }) {
  return <ul className="Tabs-head nav nav-tabs">{children}</ul>;
}

TabHead.propTypes = {
  children: PropTypes.any,
};
