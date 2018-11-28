import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './PageTitle.scss';

export default function PageTitle({ title, subtitle, tagline, margin }) {
  return (
    <div className="PageTitle">
      {tagline && <div className="font-size-md mb-1 mb-lg-2">{tagline}</div>}
      <h1 className={classNames('d-block d-sm-inline-block text-white', {'mb-3 mb-lg-5': margin})}>
        {title}
        {subtitle && <div className="subtitle break-word">{subtitle}</div>}
      </h1>
    </div>
  );
}

PageTitle.propTypes = {
  title: PropTypes.any,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  tagline: PropTypes.string,
  margin: PropTypes.bool,
};
PageTitle.defaultProps = {
  margin: true,
};
