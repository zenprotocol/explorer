import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './InfoBox.scss';

function ContentBox({ className, iconClass, title, content, children, ...props }) {
  return (
    <div className="InfoBox col border border-dark" {...props}>
      <div className={classNames('content-box d-flex align-items-center flex-wrap', className)}>
        <div className="content-wrapper d-flex align-items-center">
          <div className="icon text-secondary d-flex align-items-center justify-content-center">
            <i className={iconClass} />
          </div>
          <div className="content">
            <div className="title text-secondary">{title}</div>
            <div className="value display-2 text-white text-monospace">{content}</div>
          </div>
        </div>
        {children ? <div className="body">{children}</div> : null}
      </div>
    </div>
  );
}
ContentBox.propTypes = {
  title: PropTypes.any,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  className: PropTypes.string,
  iconClass: PropTypes.string,
  children: PropTypes.any,
};

export default ContentBox;
