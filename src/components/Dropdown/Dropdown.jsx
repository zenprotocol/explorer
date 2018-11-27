import React from 'react';
import ReactDropdown from 'react-dropdown';
import './Dropdown.scss';

export default function Dropdown(props) {
  return (
    <ReactDropdown
      className="Dropdown"
      arrowClosed={<i className="fas fa-caret-down"/>}
      arrowOpen={<i className="fas fa-caret-up"/>}
      {...props} />
  );
}