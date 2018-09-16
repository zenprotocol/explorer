import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './Loading.css';

export default function Loading({ className, ...props }) {
  return (
    <div className={classNames('Loading text-center', className)} {...props}>
      <span><i className="icon fa fa-spinner fa-spin" /> Loading...</span>
    </div>
  );
}

Loading.propTypes = {
  className: PropTypes.string,
};
