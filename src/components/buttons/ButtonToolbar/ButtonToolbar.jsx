import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './ButtonToolbar.scss';

export default function ButtonToolbar({className, children, ...props}) {
  return (
    <div className={classnames('ButtonToolbar', className)} {...props}>
      {children}
    </div>
  );
}

ButtonToolbar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
};
