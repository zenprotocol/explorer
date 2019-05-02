import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './InfoBox.scss';

function ContentBox(props) {
  return (
    <div className="InfoBox col border border-dark">
      <div
        className={classNames('content-box d-flex align-items-center flex-wrap', props.className)}
      >
        <div className="content-wrapper d-flex align-items-center">
          <div className="icon text-secondary d-flex align-items-center justify-content-center">
            <i className={props.iconClass} />
          </div>
          <div className="content">
            <div className="title text-secondary">{props.title}</div>
            <div className="value display-2 text-white text-monospace">{props.content}</div>
          </div>
        </div>
        {props.children ? <div className="body">{props.children}</div> : null}
      </div>
    </div>
  );
}
ContentBox.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
  className: PropTypes.string,
  iconClass: PropTypes.string,
  children: PropTypes.any,
};

export default ContentBox;