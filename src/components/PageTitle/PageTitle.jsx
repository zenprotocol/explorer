import React from 'react-dom';
import PropTypes from 'prop-types';

export default function PageTitle({ title, subtitle }) {
  return (
    <div className="PageTitle row">
      <div className="col-sm">
        <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
          {title}
          <div className="subtitle break-word">{subtitle}</div>
        </h1>
      </div>
    </div>
  );
}

PageTitle.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};
