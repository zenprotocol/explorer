import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './buttons.css';

export default function LinkButton(props) {
  return (
    <a className={classNames('Button btn', `btn-${props.type}`, props.className)} target={props.target} href={props.href} onClick={props.onClick}>
      {props.children}
    </a>
  );
}

LinkButton.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  target: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.any,
};

LinkButton.defaultProps = {
  target: '_self',
  type: 'primary-strong',
};
