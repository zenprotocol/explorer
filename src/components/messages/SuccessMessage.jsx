import React from 'react';
import PropTypes from 'prop-types';
import Message from './Message.jsx';

export default function SuccessMessage(props) {
  return <Message theme="primary" icon={<i className="fal fa-check-circle"></i>}>{props.children}</Message>;
}

SuccessMessage.propTypes = {
  children: PropTypes.any,
};
