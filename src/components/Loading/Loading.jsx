import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './Loading.css';

export default function Loading({ className, text, ...props }) {
  return (
    <div className={classNames('Loading text-center', className)} {...props}>
      <span><i className="icon fa fa-spinner fa-spin" />{text}</span>
    </div>
  );
}

Loading.propTypes = {
  className: PropTypes.string,
};

Loading.defaultProps = {
  text: ' Loading...'
};
