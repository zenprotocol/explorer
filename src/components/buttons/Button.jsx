import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './buttons.css';

export default function Button(props) {
  return (
    <button
      data-balloon={props.title}
      data-balloon-pos="up-left"
      type={props.isSubmit ? 'submit' : 'button'}
      className={classNames(
        'Button btn',
        `btn-${props.type}`,
        `btn-size-${props.size}`,
        props.className
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func,
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
