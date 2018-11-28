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
  title: PropTypes.string,
  children: PropTypes.any,
};

Button.defaultProps = {
  type: 'primary',
  size: 'lg',
};

const LinkButton = ({ title, type, size, className, children, ...rest }) => (
  <a
    data-balloon={title}
    data-balloon-pos="up-left"
    className={classNames('Button btn', `btn-${type}`, `btn-size-${size}`, className)}
    {...rest}
  >
    {children}
  </a>
);

const InputButton = ({ title, isSubmit, type, size, className, children, ...rest }) => (
  <button
    data-balloon={title}
    data-balloon-pos="up-left"
    type={isSubmit ? 'submit' : 'button'}
    className={classNames('Button btn', `btn-${type}`, `btn-size-${size}`, className)}
    {...rest}
  >
    {children}
  </button>
);
