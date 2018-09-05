import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './buttons.css';

export default function Button(props) {
  return (
    <button className={classNames('Button btn', `btn-${props.type}`, props.className)} onClick={props.onClick}>{props.children}</button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
};

Button.defaultProps = {
  type: 'primary-strong',
};