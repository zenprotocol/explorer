import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './buttons.css';

export default function LinkButton(props) {
  const {title, className, type, size, target, ...rest} = props;
  return (
    <a
      data-balloon={title}
      data-balloon-pos="up-left"
      className={classNames('Button btn', `btn-${type}`, `btn-size-${size}`, className)}
      target={target}
      {...rest}
    >
      {props.children}
    </a>
  );
}

LinkButton.propTypes = {
  target: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.any,
};

LinkButton.defaultProps = {
  target: '_self',
  type: 'primary',
  size: 'lg',
};
