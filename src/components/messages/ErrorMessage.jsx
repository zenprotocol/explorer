import React from 'react';
import PropTypes from 'prop-types';
import Message from './Message.jsx';

export default function ErrorMessage(props) {
  return <Message theme="danger" icon={<i className="fal fa-times-circle"></i>}>{props.children}</Message>;
}

ErrorMessage.propTypes = {
  children: PropTypes.any,
};
