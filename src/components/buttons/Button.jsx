import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './buttons.css';

export default function Button(props) {
  const {title, isSubmit, className, type, size, ...rest} = props;
  return (
    <button
      data-balloon={title}
      data-balloon-pos="up-left"
      type={isSubmit ? 'submit' : 'button'}
      className={classNames(
        'Button btn',
        `btn-${type}`,
        `btn-size-${size}`,
        className
      )}
      {...rest}
    >
      {props.children}
    </button>
  );
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
  type: 'primary-strong',
  size: 'lg',
};
