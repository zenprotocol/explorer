import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './ButtonToolbar.css';

export default function ButtonToolbar({className, ...props}) {
  return (
    <div className={classnames('ButtonToolbar', className)} {...props}>
      {props.children}
    </div>
  );
}

ButtonToolbar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
};
