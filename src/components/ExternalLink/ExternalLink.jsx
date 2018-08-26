import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default function ExternalLink(props) {
  return (
    <a className={classNames('external-link', props.className)} target={props.target} rel="noopener noreferrer" href={props.url}>
      {props.children}
    </a>
  );
}

ExternalLink.propTypes = {
  url: PropTypes.string,
  target: PropTypes.string,
  children: PropTypes.any,
  className: PropTypes.string,
};

ExternalLink.defaultProps = {
  target: '_blank',
};
