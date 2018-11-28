import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './Message.scss';

const LINK_TYPE_NAMES = ['Link', 'a', 'HashLink'];

export default function Message({ theme, icon, children, ...props }) {
  return (
    <div className={`border-${theme}`}>
      <div
        className={classnames(
          'Message',
          `Message-${theme}`,
          `rounded-bottom`,
          { 'has-icon': icon }
        )}
        {...props}
      >
        <div className={`Message-icon text-${theme}`}>{icon}</div>
        <div className="Message-body">
          {React.Children.map(children, child => applyThemeToLink(child, theme))}
        </div>
      </div>
    </div>
  );
}

Message.propTypes = {
  children: PropTypes.any,
  theme: PropTypes.string,
  icon: PropTypes.node,
};

Message.defaultProps = {
  theme: 'primary',
};

const applyThemeToLink = (child, theme) => {
  const type = child.type ? (typeof child.type === 'string' ? child.type : child.type.name) : '';
  if (type && LINK_TYPE_NAMES.includes(type)) {
    return React.cloneElement(child, {
      className: classnames(child.props.className, `text-${theme}`),
    });
  }
  return child;
};
