import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Button.scss';

export default function Button(props) {
  return props.href ? <LinkButton {...props} /> : <InputButton {...props} />;
}

Button.propTypes = {
  isSubmit: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.string,
  children: PropTypes.any,
};

Button.defaultProps = {
  type: 'primary',
  size: 'lg',
};

const LinkButton = ({ type, size, className, children, ...rest }) => (
  <a
    className={classNames('Button btn', `btn-${type}`, `btn-size-${size}`, className)}
    {...rest}
  >
    {children}
  </a>
);

const InputButton = ({ isSubmit, type, size, className, children, ...rest }) => (
  <button
    type={isSubmit ? 'submit' : 'button'}
    className={classNames('Button btn', `btn-${type}`, `btn-size-${size}`, className)}
    {...rest}
  >
    {children}
  </button>
);
