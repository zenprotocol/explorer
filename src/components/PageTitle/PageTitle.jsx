import React from 'react';
import PropTypes from 'prop-types';
import './PageTitle.css';

export default function PageTitle({ title, subtitle, tagline }) {
  return (
    <div className="PageTitle">
      {tagline && <div className="font-size-md mb-1 mb-lg-2">{tagline}</div>}
      <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
        {title}
        {subtitle && <div className="subtitle break-word">{subtitle}</div>}
      </h1>
    </div>
  );
}

PageTitle.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  tagline: PropTypes.string,
};
